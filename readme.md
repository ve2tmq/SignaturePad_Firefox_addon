🔐 FIDO2 Signature Injector

Turn your YubiKey into a digital sovereign stamp.

A Firefox extension that allows you to cryptographically sign web forms and HTML5 Canvases using the FIDO2/WebAuthn protocol. It bridges the gap between hardware authentication and document signing.

    Philosophy: "Sign with what you hold (Hardware), not what you know (Passwords)."

✨ Features

    🔒 Hardware-Backed Security: Uses the ECDSA private key stored inside your FIDO2 device (YubiKey, SoloKey, etc.). The key never leaves the hardware.

    🚫 Serverless & Private: 100% Client-Side. No data is ever sent to a third-party signing server. You own your data.

    📄 Hybrid Proof:

        Visual: Injects your handwritten signature (PNG) + a cryptographic QR Code directly onto the canvas.

        Digital: Automatically downloads a JSON Proof File containing the document hash, timestamp, form data, and the hardware Credential ID.

    🎣 Anti-Phishing: Signatures are cryptographically bound to the website's domain (RP ID). A signature generated for bank.com cannot be replayed on fake-bank.com.

    📱 Universal Verification: The generated QR Code uses a lightweight format (attestation: "none") readable by any standard smartphone camera.

🛠️ How it Works (The "Magic")

Standard FIDO2 is designed for Authentication (logging in). This tool repurposes it for Signing documents using a technique called Challenge Hijacking:

    The extension scrapes the document content (Canvas + Text + Form Data).

    It calculates a SHA-256 Hash of this content.

    It sends this Hash to the security key as the WebAuthn Challenge.

    The key signs the challenge (and thus the document) along with the domain and a "User Presence" flag.

    The result is embedded in a QR Code and a JSON file.

## 💡 Rationale: Why FIDO2?

Why build a new signing tool when **PGP/GPG** and **X.509** (Smart Cards) already exist?
Because modern web browsers have architecturally locked them out.

### 🚫 The Problem with Existing Standards
* **X.509 / Smart Cards:** Modern browsers (Firefox/Chrome) sandbox the cryptographic environment. They use client certificates for *Authentication* (mTLS) but generally block web pages from using them to sign arbitrary text data (to prevent fingerprinting and non-consensual signing). Implementing this today requires installing heavy "Middleware" drivers on every client machine.
* **PGP / GPG:** It relies on local software and file management. It is not native to the web ecosystem and offers poor UX for non-technical users (managing keyrings, understanding public/private keys).

### ✅ The FIDO2 Solution (This Project)
**FIDO2 / WebAuthn** is the *only* cryptographic standard that is:
1.  **Native:** Built into every modern browser (no drivers needed).
2.  **Hardware-Backed:** Keys are generated and stored in the secure element (silicon), making them un-copyable.
3.  **User-Interactive:** Requires "User Presence" (physical touch) for every signature, providing a legally robust "Proof of Intent" that software-based certificates cannot offer.

**In short:** This project hacks the FIDO2 "Authentication" protocol to perform "Document Signing," reclaiming digital sovereignty without installing local software.

🚀 Installation (Developer Mode)

Currently, this extension is a "Proof of Concept" and is loaded via Firefox Debugging mode.

    Clone this repository:
    Bash

    git clone https://github.com/your-username/fido2-signature-injector.git
    cd fido2-signature-injector

    Open Firefox and navigate to about:debugging.

    Click on "This Firefox" > "Load Temporary Add-on...".

    Select the manifest.json file from the project directory.

🖋️ Usage

    Navigate to any webpage containing a signature canvas (e.g., Signature Pad Demo).

    Right-Click on the canvas area.

    Select "Signer (FIDO2)" from the context menu.

    A button will appear on the page. Click it and touch your security key.

    Done! The extension will:

        Draw your visual signature (if configured).

        Draw a QR Code containing the cryptographic proof.

        Download a proof_signature_....json file to your computer.

Configuration (Optional)

You can upload a PNG image of your handwritten signature in the extension options. This image will be injected alongside the QR code.
⚖️ Verifying a Signature (Audit)

To prove that a document has not been altered since it was signed, use the included Python audit tool.

Requirements: Python 3 (No external libraries required for the basic verification script).

Command:
Bash

# Syntax: python3 verify_sign.py '<JSON_FROM_QR_CODE>' <PROOF_FILE.json>

python3 verify_sign.py '{"v":1,"t":"2025..."}' proof_signature_2025-12-13.json

Output Example:
Plaintext

⚖️  FIDO2 SIGNATURE AUDIT

🔹 Hash in QR Code:  P-He351MkCi6I4ntAZuMeb5MQw_hTjThIe6Yxoc6J1I
🔹 Domain:           szimek.github.io

📂 Detected Format:  Full Proof (v2)
🔑 Key ID (Credential):
   upvZfp5xLW2swj4OKddP_lnVq7GozZUAZQObe0NHdfJzkBU...

-----------------------------------
✅ VERDICT: VALID & INTEGRAL
   1. The file has not been modified.
   2. The QR Code matches the file.
   3. The signature originated from the hardware key identified above.
-----------------------------------

If even a single character in the document or the timestamp is modified, the tool will return: ❌ VERDICT: INVALID / ALTERED.
🧩 Project Structure

    manifest.json: Firefox extension configuration.

    content.js: Core logic (DOM injection, FIDO2 interaction, Canvas drawing).

    background.js: Context menu management.

    verify_sign.py: Forensic audit tool (Python).

    lib/: External dependencies (QRCode.js, SignaturePad).

📄 License

MIT License. Feel free to fork, modify, and contribute.
