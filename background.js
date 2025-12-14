// background.js - Version FIDO2 Ultra-Légère

// 1. On crée l'entrée dans le menu clic-droit au démarrage
browser.contextMenus.create({
  id: "inject-signature",
  title: "Signer avec Clé de Sécurité (FIDO2)",
  contexts: ["all"] // On laisse "all" pour être sûr qu'il apparaisse partout
});

// 2. On écoute le clic sur ce menu
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "inject-signature") {
    // Le SEUL job du background : dire au content.js "C'est à toi de jouer !"
    browser.tabs.sendMessage(tab.id, { action: "injectSignature" });
  }
});
