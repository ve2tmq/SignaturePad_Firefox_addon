// La fonction pour afficher les messages de statut
function showStatus(message, type) {
    const statusContainer = document.getElementById('statusMessage');

    // On crée un nouveau paragraphe ou div pour chaque message
    const newMessage = document.createElement('div');
    newMessage.textContent = message;
    newMessage.classList.add('status-message', type);

    // On l'insère au début du conteneur (les messages les plus récents en haut)
    statusContainer.prepend(newMessage);

    // Et on s'assure que le message disparait après un certain temps pour pas surcharger la page
    setTimeout(() => {
        newMessage.remove();
    }, 5000); // 5 secondes
}

// Fonction pour sauvegarder les fichiers
async function saveFile(file, key, successMessage, errorMessage) {
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const fileData = e.target.result;
      
      // Vérification spécifique pour le fichier de signature Base64
      if (key === 'signatureBase64' && !fileData.startsWith('data:image/')) {
        showStatus(`Le fichier ${file.name} ne contient pas une image Base64 valide.`, 'error');
        return;
      }
      
      // Stocke les données dans l'espace de stockage de l'extension
      await browser.storage.local.set({[key]: fileData});
      showStatus(successMessage, 'success');
      
    } catch (error) {
      showStatus(errorMessage, 'error');
      console.error('Erreur lors de la lecture ou du stockage du fichier:', error);
    }
  };
  reader.readAsText(file);
}

// Fonctions de gestion des événements pour chaque champ de fichier
function handleSignatureFileChange(event) {
  const file = event.target.files[0];
  saveFile(
    file,
    'signatureBase64',
    "Fichier de signature chargé avec succès et stocké de manière persistante.",
    "Erreur lors de la lecture du fichier de signature."
  );
}

function handlePgpFileChange(event) {
  const file = event.target.files[0];
  saveFile(
    file,
    'pgpKey',
    "Clé GPG chargée avec succès et stockée de manière persistante.",
    "Erreur lors de la lecture du fichier de clé GPG."
  );
}

// Fonction pour restaurer les noms de fichiers et afficher le statut au chargement de la page
async function restoreAndShowStatus() {
  const result = await browser.storage.local.get(['signatureBase64', 'pgpKey']);
  
  if (result.signatureBase64) {
    showStatus("Une signature est déjà en mémoire.", 'success');
  }
  
  if (result.pgpKey) {
    showStatus("Une clé GPG est déjà en mémoire.", 'success');
  }
}

// Ajoute les écouteurs d'événements
document.addEventListener('DOMContentLoaded', restoreAndShowStatus);
document.getElementById('signatureFile').addEventListener('change', handleSignatureFileChange);
document.getElementById('pgpFile').addEventListener('change', handlePgpFileChange);
