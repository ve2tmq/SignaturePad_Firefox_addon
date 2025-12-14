// options.js

document.getElementById("apply").addEventListener("click", async () => {
  const signatureFileInput = document.getElementById('signatureFile');
  const signatureFile = signatureFileInput.files[0];
  const statusMsg = document.getElementById('statusMessage');

  let configToSave = {};

  // Traitement du fichier de signature visuelle (si présent)
  if (signatureFile) {
    try {
      const text = await signatureFile.text();
      configToSave.signatureBase64 = text.trim();
    } catch (e) {
      console.error("Erreur lecture fichier:", e);
      alert("Impossible de lire le fichier.");
      return;
    }
  }

  // Sauvegarde dans le storage local du navigateur
  await browser.storage.local.set(configToSave);

  // Feedback visuel
  statusMsg.textContent = "✅ Configuration sauvegardée !";
  statusMsg.classList.remove("hidden");
  
  setTimeout(() => {
    statusMsg.classList.add("hidden");
  }, 3000);
});

// Au chargement, on pourrait afficher qu'un fichier est déjà présent, 
// mais pour la sécurité on ne peut pas pré-remplir un input file.
