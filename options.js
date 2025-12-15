// options.js - FIDO2 Signature Injector Configuration

const fileInput = document.getElementById('file-input');
const previewImg = document.getElementById('signature-preview');
const placeholder = document.getElementById('placeholder-text');
const statusMsg = document.getElementById('status-msg');
const clearBtn = document.getElementById('clear-btn');

// 1. On Load: Check if a signature is already saved
document.addEventListener('DOMContentLoaded', async () => {
  const stored = await browser.storage.local.get('signatureBase64');
  if (stored.signatureBase64) {
    showPreview(stored.signatureBase64);
  }
});

// 2. Handle File Selection
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Security check: Limit size to ~500KB to prevent UI lag during injection
  if (file.size > 500 * 1024) {
    alert("Warning: The image is quite large (>500KB). It might slow down the signing process.");
  }

  const reader = new FileReader();

  // Callback when file reading is complete (Base64 conversion)
  reader.onload = (event) => {
    const base64String = event.target.result;
    
    // Save the Base64 string to Firefox Local Storage
    browser.storage.local.set({ signatureBase64: base64String }).then(() => {
      showPreview(base64String);
      showStatus("✅ Signature saved successfully!");
    });
  };

  // Start reading the file as a Data URL (Base64)
  reader.readAsDataURL(file);
});

// 3. Handle "Remove" Button
clearBtn.addEventListener('click', () => {
  // Confirm action with user
  if (!confirm("Are you sure you want to remove your signature?")) return;

  browser.storage.local.remove('signatureBase64').then(() => {
    fileInput.value = ""; // Reset the file input
    hidePreview();
    showStatus("🗑️ Signature removed.");
  });
});

// --- Utility Functions ---

function showPreview(base64) {
  previewImg.src = base64;
  previewImg.style.display = 'inline-block';
  placeholder.style.display = 'none';
  clearBtn.style.display = 'inline-block';
}

function hidePreview() {
  previewImg.src = '';
  previewImg.style.display = 'none';
  placeholder.style.display = 'inline-block';
  clearBtn.style.display = 'none';
}

function showStatus(text) {
  statusMsg.textContent = text;
  // Clear the status message after 3 seconds
  setTimeout(() => { statusMsg.textContent = ''; }, 3000);
}
