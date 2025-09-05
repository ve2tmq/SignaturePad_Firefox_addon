from PIL import Image
import base64
import io
import sys

def image_en_base64_png(image_path):
    # Ouvre l'image avec Pillow
    with Image.open(image_path) as img:
        # Crée un buffer de mémoire
        buffer = io.BytesIO()
        
        # Sauvegarde l'image dans le buffer au format PNG
        img.save(buffer, format='PNG')
        
        # Récupère les données binaires
        donnees_binaires = buffer.getvalue()
        
        # Encode en Base64
        base64_encode = base64.b64encode(donnees_binaires).decode('utf-8')
        
    # Crée la Data URI complète avec le préfixe PNG
    signature_base64 = f"data:image/png;base64,{base64_encode}"
    with open("assets/signature.txt", "wt") as file_b64:
        file_b64.write(signature_base64)

    return signature_base64


signature_base64 = image_en_base64_png(sys.argv[1])
print(signature_base64)

