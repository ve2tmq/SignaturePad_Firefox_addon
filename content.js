// content.js - Version "Sharp QR" 🦅

let clickedCanvas = null; 

// =============================================================================
// 🛡️ BOUCLIER GLOBAL (Empêche l'effacement au clic droit)
// =============================================================================
const blockSiteInterference = (e) => {
    if (e.button === 2) {
        if (e.target.tagName === "CANVAS") {
            e.stopImmediatePropagation(); 
            e.stopPropagation();
        }
    }
};

window.addEventListener("pointerdown", blockSiteInterference, true);
window.addEventListener("mousedown", blockSiteInterference, true);
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName === "CANVAS" && e.touches.length > 1) {
        e.stopImmediatePropagation();
    }
}, true);

// =============================================================================
// 1. INJECTION SCRIPT
// =============================================================================
function injectScriptIntoDOM() {
  if (document.getElementById('fido-injector-script')) return;
  const script = document.createElement('script');
  script.id = 'fido-injector-script';
  script.src = browser.runtime.getURL("injected_fido.js");
  document.body.appendChild(script);
}

// =============================================================================
// 2. EXTENSION UTILS
// =============================================================================
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  return await crypto.subtle.digest('SHA-256', msgBuffer);
}

function bufferToBase64Ext(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function downloadProof(dataObj) {
  const dataStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([dataStr], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signature_proof_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  a.onclick = (e) => e.stopPropagation();
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn("Image load failed"); resolve(null); };
    img.src = src;
  });
}

function generateQRImage(text, size) {
  return new Promise((resolve) => {
    try {
        const tempDiv = document.createElement('div');
        // On génère un QR sans marge pour maximiser la taille utile
        new QRCode(tempDiv, { 
            text: text, 
            width: size, 
            height: size, 
            correctLevel: QRCode.CorrectLevel.L // Low error correction = Moins de densité = Plus lisible
        });
        setTimeout(() => {
          const img = tempDiv.querySelector('img');
          if (img && img.src) resolve(img.src);
          else { const c = tempDiv.querySelector('canvas'); resolve(c ? c.toDataURL() : null); }
        }, 100);
    } catch (e) { resolve(null); }
  });
}

// =============================================================================
// 3. LOGIQUE PRINCIPALE
// =============================================================================

async function startSigningProcess(canvas) {
  try {
      injectScriptIntoDOM();

      const visibleText = document.body.innerText;
      const allFormData = [];
      document.querySelectorAll("form").forEach((form, index) => {
        try {
          const formData = new FormData(form);
          if (typeof formData.entries === 'function') {
              allFormData.push({ formIndex: index, data: Object.fromEntries(formData.entries()) });
          }
        } catch (e) {}
      });
      
      const payloadStr = JSON.stringify({
        ts: Math.floor(Date.now() / 1000),
        txt: visibleText,
        frm: allFormData
      });

      const [storage, challengeBuffer] = await Promise.all([
        browser.storage.local.get("signatureBase64"),
        sha256(payloadStr)
      ]);
      
      const pngSignature = storage.signatureBase64;
      const challengeBase64 = bufferToBase64Ext(challengeBuffer);
      const rpId = window.location.hostname;

      if (!pngSignature) {
          alert("⚠️ Configurez votre signature dans les options d'abord !");
          return;
      }

      const rect = canvas.getBoundingClientRect();
      const top = rect.top + window.scrollY + (rect.height/2) - 30;
      const left = rect.left + window.scrollX + (rect.width/2) - 100;

      // --- LE HANDLER ---
      const successHandler = async (e) => {
        document.removeEventListener("FIDO_SUCCESS_RETURN", successHandler);
        
        try {
            const payload = JSON.parse(e.detail);
            const ctx = canvas.getContext('2d');
            
            // On génère le QR en haute résolution (500px) pour qu'il soit net à la source
            const [imgSign, qrDataURL] = await Promise.all([
                loadImage(pngSignature),
                generateQRImage(JSON.stringify(payload.qr), 500) 
            ]);
            const imgQR = await loadImage(qrDataURL);

            // 1. DESSIN & COLORISATION
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // A. Signature (Vert SurveyJS)
            if (imgSign) {
                // On laisse plus de place à droite pour le QR (Largeur signature = 50%)
                const signWidth = canvas.width * 0.50; 
                const signHeight = canvas.height * 0.90; 
                const signX = canvas.width * 0.02; 
                const signRatio = imgSign.width / imgSign.height;
                let dW = signWidth, dH = signWidth / signRatio;
                if (dH > signHeight) { dH = signHeight; dW = dH * signRatio; }
                
                ctx.drawImage(imgSign, signX, (canvas.height - dH)/2, dW, dH);
                
                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = "#000000"; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = "source-over";
            }

            // Fond Blanc Général
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";

            // B. QR Code (Optimisé pour la netteté)
            if (imgQR) {
                // On augmente la taille du QR à 45% du canvas
                const qrBox = Math.min(canvas.width * 0.45, canvas.height * 0.95);
                const qrX = canvas.width - qrBox - (canvas.width * 0.01); 
                const qrY = (canvas.height - qrBox) / 4;
                
                // ⬜ FOND BLANC SOUS LE QR (Contraste max)
                ctx.fillStyle = "white";
                ctx.fillRect(qrX, qrY, qrBox, qrBox);

                // 🦅 NETTETÉ MAXIMALE (Pixel Perfect)
                // C'est ça qui empêche le QR d'être flou
                ctx.imageSmoothingEnabled = false; 
                
                ctx.drawImage(imgQR, qrX, qrY, qrBox, qrBox);
                
                // On réactive le lissage pour le reste (si besoin)
                ctx.imageSmoothingEnabled = true;

                // Label
                ctx.font = "bold 10px sans-serif";
                ctx.fillStyle = "#000000";
                ctx.textAlign = "center";
                ctx.fillText("FIDO2 Signed", qrX + qrBox/2, qrY + qrBox + 10);
            }

            // 2. FORCE SYNC
            const finalDataURL = canvas.toDataURL("image/png");
            try { canvas.value = finalDataURL; } catch(e) {}

            let hiddenInput = canvas.parentElement.querySelector('input') 
                           || canvas.parentElement.parentElement.querySelector('input');
            if (hiddenInput) {
                hiddenInput.value = finalDataURL;
                hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 3. WAKE UP CALL
            const clientX = rect.left + 1;
            const clientY = rect.top + 1;
            const dispatchEvent = (type) => {
                canvas.dispatchEvent(new MouseEvent(type, {
                    bubbles: true, cancelable: true, view: window,
                    clientX: clientX, clientY: clientY, buttons: 1
                }));
            };
            dispatchEvent('mousedown');
            dispatchEvent('mouseup'); 
            dispatchEvent('click');
            
            canvas.dispatchEvent(new Event('change', { bubbles: true }));
            canvas.dispatchEvent(new Event('input', { bubbles: true }));

            // 4. PREUVE
            downloadProof({ meta: payload.file, document: JSON.parse(payloadStr) });
            
        } catch (err) {
            alert("Erreur: " + err.message);
        }
      };
      
      const errorHandler = (e) => {
          document.removeEventListener("FIDO_ERROR_RETURN", errorHandler);
          alert("Erreur FIDO: " + e.detail);
      };

      document.addEventListener("FIDO_SUCCESS_RETURN", successHandler);
      document.addEventListener("FIDO_ERROR_RETURN", errorHandler);

      if (window.wrappedJSObject && window.wrappedJSObject.spawnFidoButton) {
        window.wrappedJSObject.spawnFidoButton(challengeBase64, rpId, top, left);
      } else {
        const scriptVar = document.createElement('script');
        scriptVar.textContent = `window.spawnFidoButton('${challengeBase64}', '${rpId}', ${top}, ${left});`;
        document.body.appendChild(scriptVar);
        setTimeout(() => scriptVar.remove(), 100);
      }
  } catch (globalErr) {
      console.error(globalErr);
  }
}

// 4. LISTENER EXTENSION
window.addEventListener("contextmenu", (event) => {
  if (event.target.tagName === "CANVAS") {
    clickedCanvas = event.target;
    // Pas de new SignaturePad() ici !
  }
}, true);

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "injectSignature") {
    if (clickedCanvas) {
        startSigningProcess(clickedCanvas);
    } else {
        alert("Veuillez faire un clic droit sur la zone de signature.");
    }
  }
});
