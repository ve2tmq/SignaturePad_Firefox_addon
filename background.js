// background.js

// Context menu
browser.contextMenus.create({
  id: "inject-signature",
  title: "Inject signature",
  contexts: ["all"]
});


// Listen to onClicked
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "inject-signature") {
    browser.tabs.sendMessage(tab.id, { action: "injectSignature" });
  }
});


let passphraseResolver = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "askPassphrase") {
    browser.windows.create({
      url: browser.runtime.getURL("popup.html"),
      type: "popup",
      width: 360,
      height: 240,
      allowScriptsToClose: true,
      focused: true
    });

    // Stocke le resolver pour usage ultérieur
    passphraseResolver = sendResponse;
    return true; // indique que la réponse est asynchrone
  }

  // Réception du mot de passe depuis popup
  if (message.action === "passphraseResponse" && passphraseResolver) {
    if (message.passphrase) {
      passphraseResolver(message.passphrase);
    } else {
      passphraseResolver(null); // ou reject(new Error("Cancelled")) si tu veux gérer l’erreur
    }
    passphraseResolver = null;
  }
});


async function signPayloadWithGPG(payload) {
  const { gpgPath, keyID } = await browser.storage.local.get(["gpgPath", "keyID"]);

  const response = await browser.runtime.sendNativeMessage("gpg_wrapper", {
    gpgPath,
    keyID,
    payload
  });

  return response.signature;
}
