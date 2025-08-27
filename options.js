document.getElementById("signatureFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64 = e.target.result;

    // Save config on browser
    await browser.storage.local.set({ signatureBase64: base64 });

    // Preview signature
    const preview = document.getElementById("preview");
    preview.src = base64;

    // Confirm message
    document.getElementById("status").textContent = "✅ Signature enregistrée et affichée.";
  };

  reader.readAsDataURL(file);
});

// Load and show signature.
window.addEventListener("DOMContentLoaded", async () => {
  const { signatureBase64 } = await browser.storage.local.get("signatureBase64");
  if (signatureBase64) {
    document.getElementById("preview").src = signatureBase64;
    document.getElementById("status").textContent = "Signature actuelle chargée.";
  }
});
