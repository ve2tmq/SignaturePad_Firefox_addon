// background.js

browser.contextMenus.create({
  id: "inject-signature",
  title: "Sign with key (FIDO2)",
  contexts: ["all"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "inject-signature") {
    browser.tabs.sendMessage(tab.id, { action: "injectSignature" });
  }
});
