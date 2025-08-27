// content.js

// On déclare la variable ici pour que les deux fonctions puissent y accéder.
// On l'initialise à null pour commencer.
let clickedCanvas = null;

// Écouteur de clic pour stocker l'élément cliqué.
// Cette partie est toujours active et écoute les clics sur n'importe quel canvas.
document.addEventListener("click", (event) => {
  if (event.target.tagName === "CANVAS") {
    // On garde une référence au dernier canvas cliqué.
    clickedCanvas = event.target;
    console.log("Canvas cliqué stocké.");
  }
});


/*
// On injecte un script qui exécute du code directement sur la page.
            const script = document.createElement('script');
            script.textContent = `
                // On trouve le canvas que l'utilisateur a cliqué.
                const targetCanvas = document.querySelector("#${clickedCanvas.id}");
                if (targetCanvas) {
                    // On recrée temporairement une instance sur ce canvas.
                    const tempPad = new SignaturePad(targetCanvas);
                    // On charge l'image, ce qui met à jour le canvas.
                    tempPad.fromDataURL('${imageDataUrl}').then(() => {
                         console.log("Image injected via content script.");
                    });
                }
            `;
            document.body.appendChild(script);
            script.remove();*/


// Listen messages from background.js
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "injectSignature") {
    if (!clickedCanvas) {
      console.error("Canvas not found.");
      alert("Canvas must clicked before inject signature.")
      return;
    }
    
    const signaturePad = new SignaturePad(clickedCanvas);

    try {
        const url = browser.runtime.getURL("assets/signature.txt");

        fetch(url)
        .then(response => {
            if (!response.ok) {
            throw new Error("Unable to read signature.txt");
            }
            return response.text();
        })
        .then(data => {
            console.log("File content: ", data);
            const imageDataUrl = "data:image/png;base64," + data;
            
            signaturePad.fromDataURL(imageDataUrl).then(() => {
              if (!signaturePad.isEmpty()) {
                console.log("Signature injected !");
              } else {
                console.log("Injection de la signature échouée.");
              }
            }).catch(error => {
              console.error("Erreur lors du chargement de l'image :", error);
            });
        })
        .catch(error => {
            console.error("Something went wrong: ", error);
        });
  
        
    } catch (err) {
      console.error("Error on loading signature: ", err);
    }
  }
});
