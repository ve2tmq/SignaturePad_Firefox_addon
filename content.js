// content.js

// On déclare la variable ici pour que les deux fonctions puissent y accéder.
// On l'initialise à null pour commencer.
let clickedCanvas = null;


function getFormData() {
  // On récupère le data dans les formulaires.
  const formData = {};
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const name = input.name;
      const value = input.value;
      if (name) {
        formData[name] = value;
      }
    });
  });
  
  return formData;
}


async function signAndInject(pgpKey, dataToSign) {
  try {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: pgpKey });
    const encoder = new TextEncoder();
    const message = await openpgp.createMessage({ binary: encoder.encode(dataToSign) });

    // On signe le message
    const signedMessage = await openpgp.sign({
      message: message,
      signingKeys: privateKey
    });

    // C'est la signature que tu peux maintenant insérer dans le formulaire
    console.log("Signature PGP générée avec succès :", signedMessage);
    return signedMessage;

  } catch (error) {
    console.error("Erreur lors de la signature PGP :", error);
  }
}


document.addEventListener("click", (event) => {
  // Écouteur de clic pour stocker l'élément cliqué.
  // Cette partie est toujours active et écoute les clics sur n'importe quel canvas.
  if (event.target.tagName === "CANVAS") {
    // On garde une référence au dernier canvas cliqué.
    clickedCanvas = event.target;
    console.log(`Canvas cliqué stocké. ${clickedCanvas}`);
  }
});


async function injectSignature(message) {
  if (!clickedCanvas) {
    console.error("Canvas not found.");
    alert("Canvas must clicked before inject signature.");
    return;
  }
  
  const signaturePad = new SignaturePad(clickedCanvas);
  const signature = await browser.storage.local.get(['signatureBase64', 'pgpKey']);
  const signedMessage = null;
  
  if (!signature.signatureBase64) {
    alert("Error on loading signature");
    return;
  }
  
  const dataToSign = JSON.stringify({
    pageContent: document.body.innerText,
    formData: getFormData()
  });
  
  if (signature.pgpKey) {
    const signedMessage = await signAndInject(signature.pgpKey, dataToSign);
    
    console.log("PGP Signature: ", signedMessage);
    
    // Ici, tu peux injecter le message signé quelque part sur la page
  }
  
  signaturePad.fromDataURL(signature.signatureBase64)
    .then(() => {
      if (!signaturePad.isEmpty()) {
        console.log("Signature injected !");
      } else {
        console.log("Injection de la signature échouée.");
      }
    })
    .catch(error => {
      console.error("Erreur lors du chargement de l'image :", error);
    });
}

// L'écouteur de message est maintenant beaucoup plus simple !
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "injectSignature") {
    injectSignature(message);
  }
});
