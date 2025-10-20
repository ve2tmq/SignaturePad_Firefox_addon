window.submitDialog = function () {
  const password = document.getElementById('pwd').value;

  browser.runtime.sendMessage({
    action: "passphraseResponse",
    passphrase: password
  });

  window.close(); // ferme le popup
};


window.closeDialog = function () {
    browser.runtime.sendMessage({
        action: "passphraseResponse",
        passphrase: null
    });
      
    window.close();
};


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ok").addEventListener("click", submitDialog);
  document.getElementById("cancel").addEventListener("click", closeDialog);
});
