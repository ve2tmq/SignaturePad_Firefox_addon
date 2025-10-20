window.apply = async function () {
  const gpgPath = document.getElementById('gpg').files[0]?.path || "/usr/bin/gpg";
  const keyID = document.getElementById('keyID').value;
  const signatureFile = document.getElementById('signatureFile').files[0];

  let signatureBase64 = null;
  if (signatureFile) {
    const text = await signatureFile.text();
    signatureBase64 = text.trim();
  }

  await browser.storage.local.set({
    gpgPath,
    keyID,
    signatureBase64
  });

  document.getElementById('statusMessage').textContent = "✅ Success";
  document.getElementById('statusMessage').classList.remove("hidden");
};


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("apply").addEventListener("click", apply);
});
