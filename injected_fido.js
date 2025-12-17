(function() {
  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  function base64ToBuffer(base64) {
    const binary_string = window.atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  window.spawnFidoButton = function(challengeBase64, rpId, top, left) {
    const btn = document.createElement("button");
    btn.id = "fido-native-btn";
    btn.innerHTML = "🔐 <b>Sign (FIDO2)</b>";
    
    Object.assign(btn.style, {
      position: "absolute",
      top: top + "px",
      left: left + "px",
      zIndex: 2147483647,
      width: "200px",
      padding: "15px",
      background: "#2563eb",
      color: "white",
      border: "2px solid white",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      textAlign: "center",
      fontFamily: "Arial, sans-serif"
    });

    document.body.appendChild(btn);

    btn.onclick = async () => {
      try {
        btn.innerHTML = "⏳ Touch your key...";
        btn.style.background = "#d97706";
        
        const challengeBuffer = base64ToBuffer(challengeBase64);
        
        // 1. FIDO2 Call (Ephemeral Registration)
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: challengeBuffer,
                rp: { name: "Signature", id: rpId },
                user: {
                    id: Uint8Array.from("ID", c => c.charCodeAt(0)),
                    name: "user",
                    displayName: "User"
                },
                pubKeyCredParams: [{alg: -7, type: "public-key"}],
                authenticatorSelection: {
                    authenticatorAttachment: "cross-platform",
                    userVerification: "preferred",
                    residentKey: "discouraged"
                },
                timeout: 60000,
                attestation: "none" // Optimized size
            }
        });

        const response = credential.response;
        
        // 2. Data Preparation
        
        // A. QR Code Object (LIGHTWEIGHT)
        const resultForQR = {
          v: 1,
          t: new Date().toISOString().split('T')[0],
          d: rpId,
          att: bufferToBase64(response.attestationObject), 
          c: bufferToBase64(response.clientDataJSON),
          h: challengeBase64
        };

        // B. Proof File Object (FULL)
        // Adds Key ID for audit trails
        const resultForFile = {
            ...resultForQR,
            credentialId: credential.id, 
            fullTimestamp: new Date().toISOString(),
            signatureType: "FIDO2_CREATE_EPHEMERAL"
        };

        // 3. Send Double Payload
        const finalPayload = {
            qr: resultForQR,
            file: resultForFile
        };

        btn.innerHTML = "✅ Signed!";
        btn.style.background = "#059669";
        
        document.dispatchEvent(new CustomEvent("FIDO_SUCCESS_RETURN", { detail: JSON.stringify(finalPayload) }));
        
        setTimeout(() => btn.remove(), 1000);

      } catch (err) {
        console.error("WebAuthn Error:", err);
        btn.innerHTML = "❌ Error";
        btn.style.background = "#dc2626";
        document.dispatchEvent(new CustomEvent("FIDO_ERROR_RETURN", { detail: err.message }));
        setTimeout(() => btn.remove(), 4000);
      }
    };
  };
})();
