import json
import hashlib
import sys
import base64
from datetime import datetime

def calculate_sha256(text_data):
    """Recalculates SHA-256 Hash (UTF-8)"""
    encoded_data = text_data.encode('utf-8')
    return hashlib.sha256(encoded_data).digest()

def buffer_to_base64_ext(binary_data):
    """Base64URL encoder without padding (matches JS output)"""
    encoded = base64.urlsafe_b64encode(binary_data).decode('utf-8')
    return encoded.replace('=', '')

def display_signed_content(doc_data):
    """Displays the human-readable content of the signed document"""
    print("\n📄 SIGNED DOCUMENT CONTENT")
    print("===================================")
    
    # 1. Timestamp
    if 'ts' in doc_data:
        ts = doc_data['ts']
        try:
            # Handle seconds (Unix) vs milliseconds
            dt_object = datetime.fromtimestamp(ts)
            print(f"🕒 Timestamp      : {dt_object.strftime('%Y-%m-%d %H:%M:%S')}")
        except:
            print(f"🕒 Timestamp      : {ts} (Raw format)")
    
    # 2. Visible Text
    if 'txt' in doc_data:
        text_sample = doc_data['txt']
        # Truncate if too long for preview
        preview = (text_sample[:75] + '...') if len(text_sample) > 75 else text_sample
        print(f"📝 Visible Text   : \"{preview}\"")
    
    # 3. Form Data
    if 'frm' in doc_data and isinstance(doc_data['frm'], list):
        print("\n📋 Form Data :")
        if not doc_data['frm']:
            print("   (No form fields detected)")
        
        for form in doc_data['frm']:
            idx = form.get('formIndex', '?')
            data = form.get('data', {})
            
            if data:
                print(f"   [Form #{idx}]")
                for key, value in data.items():
                    # Clean Key : Value display
                    print(f"     • {key:<15} : {value}")
            else:
                print(f"   [Form #{idx}] (Empty)")
    
    print("===================================\n")

def verify_document(qr_json_raw, proof_file_path):
    print("\n⚖️  FIDO2 SIGNATURE AUDIT\n")
    
    try:
        # --- 1. LOAD INPUTS ---
        try:
            qr_data = json.loads(qr_json_raw.strip())
        except json.JSONDecodeError:
            print("❌ Error: Invalid QR Code JSON argument.")
            return

        hash_in_qr = qr_data.get('h') or qr_data.get('dataHash')
        
        try:
            with open(proof_file_path, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
        except FileNotFoundError:
            print(f"❌ Error: File not found '{proof_file_path}'")
            return

        # --- 2. EXTRACT DATA ---
        doc_to_hash = None
        credential_id = None
        
        if 'meta' in file_data and 'document' in file_data:
            # V2 Format (Full Proof)
            doc_to_hash = file_data['document']
            credential_id = file_data['meta'].get('credentialId')
        else:
            # V1 Format (Legacy/Document Only)
            doc_to_hash = file_data

        # --- 3. DISPLAY CONTENT (VIEWER MODE) ---
        display_signed_content(doc_to_hash)

        if credential_id:
            print(f"🔑 Signer Key ID  : {credential_id[:30]}...")

        # --- 4. HASH CALCULATION & VERDICT ---
        # Reconstruct compact JSON string exactly as JS did
        doc_string = json.dumps(doc_to_hash, separators=(',', ':'))
        my_hash_bytes = calculate_sha256(doc_string)
        my_hash_b64 = buffer_to_base64_ext(my_hash_bytes)
        
        print(f"🔸 Calculated Hash: {my_hash_b64}")
        print(f"🔹 QR Seal Hash   : {hash_in_qr}")

        print("\n-----------------------------------")
        if my_hash_b64 == hash_in_qr:
            print("✅ VERDICT: VALID & AUTHENTIC")
            print("   The document content displayed above is certified exact.")
            print("   It has not been modified since the signature.")
        else:
            print("❌ VERDICT: INVALID / TAMPERED")
            print("   WARNING: The file content does NOT match the cryptographic signature!")
        print("-----------------------------------")

    except Exception as e:
        print(f"\n💥 Technical Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 verify_sign.py '<qr_json_string>' <proof_file.json>")
        sys.exit(1)
    
    qr_arg = sys.argv[1]
    file_arg = sys.argv[2]
    verify_document(qr_arg, file_arg)

