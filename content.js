// content.js

// On déclare la variable ici pour que les deux fonctions puissent y accéder.
// On l'initialise à null pour commencer.
let clickedCanvas = null;
injectModalHTML();

// Fonction pour récupérer le contenu de keypass.html et l'injecter
async function injectModalHTML() {
  try {
    const url = browser.runtime.getURL('keypass.html');
    const response = await fetch(url);
    const html = await response.text();
    
    // On crée un conteneur temporaire pour pouvoir récupérer les éléments
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    
    const styleElement = tempContainer.querySelector('style');
    const modalElement = tempContainer.querySelector('.modal');
    
    // On insère le CSS dans le <head>
    if (styleElement) {
      document.head.appendChild(styleElement);
    }
    
    // On insère le HTML de la modale dans le <body>
    if (modalElement) {
      document.body.appendChild(modalElement);
    }
  } catch (error) {
    console.error("Erreur lors de l'injection de la modale :", error);
  }
}


// Fonction asynchrone pour récupérer le mot de passe via la modale
async function getPasswordFromUser() {
  return new Promise((resolve, reject) => {
    // ÉTAPE 1: on trouve les éléments après qu'ils ont été injectés !
    const modal = document.getElementById('modal-popup');
    const passwordInput = document.getElementById('pgp-password');
    const confirmButton = document.getElementById('confirm-button');
    const cancelButton = document.getElementById('cancel-button');
    
    if (!modal) {
        reject(new Error("Modale non trouvée après injection."));
        return;
    }

    // ÉTAPE 2: on gère l'affichage et la logique de la modale
    modal.classList.add('is-visible');
    passwordInput.focus();

    const handleConfirm = () => {
        const password = passwordInput.value;
        hideModal();
        resolve(password);
        cleanupListeners();
    };
    
    const handleCancel = () => {
        hideModal();
        reject(new Error("Signature annulée par l'utilisateur."));
        cleanupListeners();
    };

    const hideModal = () => {
        modal.classList.remove('is-visible');
        passwordInput.value = '';
    };

    const cleanupListeners = () => {
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
    };

    confirmButton.addEventListener('click', handleConfirm);
    cancelButton.addEventListener('click', handleCancel);
  });
}


async function signAndInject(pgpKey, dataToSign, password) {
  try {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: pgpKey });
    const decryptedKey = await openpgp.decryptKey({
        privateKey: privateKey,
        passphrase: password
    });

    const encoder = new TextEncoder();
    const message = await openpgp.createMessage({ binary: encoder.encode(dataToSign) });

    const signedMessage = await openpgp.sign({
      message: message,
      signingKeys: decryptedKey
    });

    console.log("Signature PGP générée avec succès :", signedMessage);
    return signedMessage;
  } catch (error) {
    console.error("Erreur lors de la signature PGP :", error);
    throw new Error("Erreur de signature PGP. Mot de passe incorrect ?");
  }
}


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
        try {
            // C'est ici que tu appelles la modale pour obtenir le mot de passe !
            const password = await getPasswordFromUser();
            const signedMessage = await signAndInject(signature.pgpKey, dataToSign, password);
            console.log("PGP Signature: ", signedMessage);
        } catch (error) {
            console.error("Erreur de signature :", error.message);
            return;
        }
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


// L'écouteur d'événements qui lance la fonction principale.
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "injectSignature") {
        injectSignature();
    }
});

