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
