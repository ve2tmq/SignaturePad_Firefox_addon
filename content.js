// content.js - English Version

let signaturePad = null;
let clickedCanvas = null;

// --- 1. INJECTED SCRIPT (Attestation: None for lightweight QR) ---
const INJECTED_SCRIPT_CODE = `
(function() {
  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
  }
  
  function base64ToBuffer(base64) {
    const binary_string = window.atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  window.spawnFidoButton = function(challengeBase64, rpId, top, left) {
    const btn = document.createElement("button");
    btn.id = "fido-native-btn";
    btn.innerHTML = "🔐 <b>Sign (FIDO2)</b>";
    
    Object.assign(btn.style, {
      position: "absolute",
      top: top + "px",
      left: left + "px",
      zIndex: 2147483647,
      width: "200px",
      padding: "15px",
      background: "#2563eb",
      color: "white",
      border: "2px solid white",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      textAlign: "center",
      fontFamily: "Arial, sans-serif"
    });

    document.body.appendChild(btn);

    btn.onclick = async () => {
      try {
        btn.innerHTML = "⏳ Touch your key...";
        btn.style.background = "#d97706";
        
        const challengeBuffer = base64ToBuffer(challengeBase64);
        
        // 1. FIDO2 Call (Ephemeral Registration)
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: challengeBuffer,
                rp: { name: "Signature", id: rpId },
                user: {
                    id: Uint8Array.from("ID", c => c.charCodeAt(0)),
                    name: "user",
                    displayName: "User"
                },
                pubKeyCredParams: [{alg: -7, type: "public-key"}],
                authenticatorSelection: {
                    authenticatorAttachment: "cross-platform",
                    userVerification: "preferred",
                    residentKey: "discouraged"
                },
                timeout: 60000,
                attestation: "none" // Optimized size
            }
        });

        const response = credential.response;
        
        // 2. Data Preparation
        
        // A. QR Code Object (LIGHTWEIGHT)
        const resultForQR = {
          v: 1,
          t: new Date().toISOString().split('T')[0],
          d: rpId,
          att: bufferToBase64(response.attestationObject), 
          c: bufferToBase64(response.clientDataJSON),
          h: challengeBase64
        };

        // B. Proof File Object (FULL)
        // Adds Key ID for audit trails
        const resultForFile = {
            ...resultForQR,
            credentialId: credential.id, 
            fullTimestamp: new Date().toISOString(),
            signatureType: "FIDO2_CREATE_EPHEMERAL"
        };

        // 3. Send Double Payload
        const finalPayload = {
            qr: resultForQR,
            file: resultForFile
        };

        btn.innerHTML = "✅ Signed!";
        btn.style.background = "#059669";
        
        document.dispatchEvent(new CustomEvent("FIDO_SUCCESS_RETURN", { detail: JSON.stringify(finalPayload) }));
        
        setTimeout(() => btn.remove(), 1000);

      } catch (err) {
        console.error("WebAuthn Error:", err);
        btn.innerHTML = "❌ Error";
        btn.style.background = "#dc2626";
        document.dispatchEvent(new CustomEvent("FIDO_ERROR_RETURN", { detail: err.message }));
        setTimeout(() => btn.remove(), 4000);
      }
    };
  };
})();
`;

// --- 2. EXTENSION UTILS ---

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

function injectScriptIntoDOM() {
  if (document.getElementById('fido-injector-script')) return;
  const script = document.createElement('script');
  script.id = 'fido-injector-script';
  script.textContent = INJECTED_SCRIPT_CODE;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

function downloadProof(dataObj) {
  const dataStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([dataStr], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  // Translated filename
  a.download = `signature_proof_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- 3. DRAWER (WITH LIBRARY FIX) ---

async function drawSignatureAndQR(canvas, qrData, pngBase64, padInstance) {
  console.log("🎨 Starting HD drawing...");

  // 1. SUBMIT FIX (Invisible pixel for SignaturePad)
  if (padInstance && typeof padInstance.fromData === 'function') {
      padInstance.fromData([
          { color: "rgba(0,0,0,0.01)", points: [{x: 1, y: 1}, {x: 2, y: 2}] }
      ]);
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // 2. IMAGE QUALITY: Disable smoothing for sharp QR pixels
  ctx.imageSmoothingEnabled = false; 
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;

  const padding = 10;
  const objectSize = Math.min(width / 2 - padding, height - padding); 

  // --- A. QR GENERATION (HD) ---
  const tempDiv = document.createElement('div');
  
  // Generate larger than needed (400px) for detail
  new QRCode(tempDiv, {
    text: qrData,
    width: 400,
    height: 400,
    correctLevel: QRCode.CorrectLevel.L
  });

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 300));

  const generatedImg = tempDiv.querySelector('img');
  
  if (generatedImg) {
    // Security Fix
    generatedImg.crossOrigin = "Anonymous"; 

    if (!generatedImg.complete) {
        await new Promise(r => generatedImg.onload = r);
    }

    // 3. WHITE BACKGROUND (Contrast)
    const qrX = width - objectSize - padding;
    const qrY = (height - objectSize) / 2;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX, qrY, objectSize, objectSize);

    // 4. DRAW FINAL QR
    ctx.drawImage(generatedImg, qrX, qrY, objectSize, objectSize);
    
  } else {
    console.error("Impossible to generate QR image");
    alert("Error: QR Code library unresponsive.");
    return;
  }

  // --- B. DRAW PNG SIGNATURE ---
  if (pngBase64) {
    const imgSign = new Image();
    imgSign.crossOrigin = "Anonymous";
    
    await new Promise((resolve) => {
      imgSign.onload = resolve;
      imgSign.src = pngBase64.startsWith('data:') ? pngBase64 : "data:image/png;base64," + pngBase64;
    });
    
    const ratio = imgSign.width / imgSign.height;
    let signH = objectSize;
    let signW = signH * ratio;
    
    if (signW > (width / 2) - (padding * 2)) {
        signW = (width / 2) - (padding * 2);
        signH = signW / ratio;
    }
    
    ctx.drawImage(imgSign, padding, (height - signH)/2, signW, signH);
  }

  // Legal Text
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#000000";
  const qrX = width - objectSize - padding;
  const qrY = (height - objectSize) / 2;
  ctx.fillText("FIDO2", qrX + (objectSize/2) - 15, qrY + objectSize + 12);
  
  console.log("✨ HD Drawing complete!");
}

async function startSigningProcess(padInstance) {
  injectScriptIntoDOM();

  const visibleText = document.body.innerText;
  const allFormData = [];
  document.querySelectorAll("form").forEach((form, index) => {
    const formData = new FormData(form);
    allFormData.push({ formIndex: index, data: Object.fromEntries(formData.entries()) });
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

  const canvas = padInstance.canvas;
  const rect = canvas.getBoundingClientRect();
  const top = rect.top + window.scrollY + (rect.height/2) - 30;
  const left = rect.left + window.scrollX + (rect.width/2) - 100;

  const successHandler = async (e) => {
    document.removeEventListener("FIDO_SUCCESS_RETURN", successHandler);
    
    const payload = JSON.parse(e.detail);
    
    // Convert object back to string for the QR library
    const qrText = JSON.stringify(payload.qr);

    // 1. Draw
    await drawSignatureAndQR(canvas, qrText, pngSignature, padInstance);
    
    // 2. Proof File Preparation
    const proofObject = {
        meta: payload.file,
        document: JSON.parse(payloadStr)
    };
    
    console.log("⬇️ Downloading full proof...");
    downloadProof(proofObject);
  };
  
  const errorHandler = (e) => {
      document.removeEventListener("FIDO_ERROR_RETURN", errorHandler);
      alert("Error: " + e.detail);
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
}

document.addEventListener("contextmenu", (event) => {
  if (event.target.tagName === "CANVAS") {
    clickedCanvas = event.target;
    signaturePad = new SignaturePad(clickedCanvas);
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "injectSignature") {
    if (signaturePad) {
      startSigningProcess(signaturePad);
    } else {
      alert("Error: Right-click on the canvas is required.");
    }
  }
});
