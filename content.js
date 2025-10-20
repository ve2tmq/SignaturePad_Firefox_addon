// content.js

let signaturePad = null;
let clickedCanvas = null;


async function inject_signature_into_canvas(canvas) {
  const visibleText = document.body.innerText;
  const allForms = document.querySelectorAll("form");
  const allFormData = [];
  const timestamp = new Date().toISOString();
  
  allFormData.push({visibleText: visibleText});

  allForms.forEach((form, index) => {
    const formData = new FormData(form);
    const json = Object.fromEntries(formData.entries());

    allFormData.push({
      formIndex: index,
      formName: form.getAttribute("name") || `form-${index}`,
      data: json,
    });
  });
  
  allFormData.unshift({ timestamp });
  
  console.log(allFormData);
  
  const passphrase = await browser.runtime.sendMessage({ action: "askPassphrase" });
  if (!passphrase) {
    console.warn("Cancelled");
    return;
  }
  
  const tmpCanvas = canvas.canvas;
  const qrcode = await QRCode.toCanvas(canvas, signedPayload.pgpSignature, {
    correctLevel: QRCode.CorrectLevel.H,
    height: canvas.clientHeight,
    width: canvas.clientHeight
  });
        
  canvas.fromDataURL(signedPayload.handwrittenSignature)
  .then(() => {
    if (!canvas.isEmpty()) {
      console.log("Signature injected !");
    } else {
      console.log("Signature injection failed.");
    }
  })
  .catch(error => {
    console.error("Erreur on load image:", error);
  });
}


document.addEventListener("contextmenu", (event) => {
  if (event.target.tagName === "CANVAS") {
    clickedCanvas = event.target;
    signaturePad = new SignaturePad(clickedCanvas);
    console.log("✅ Canvas clicked.", clickedCanvas);
  }
});


browser.runtime.onMessage.addListener((message) => {
  console.log("Enable listener onMessage");
  if (message.action === "injectSignature") {
    console.log("injectSignature selected");
    inject_signature_into_canvas(signaturePad);
  }
});

