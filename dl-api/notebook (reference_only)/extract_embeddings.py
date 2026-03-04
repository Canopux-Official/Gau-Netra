import os
import torch
import cv2
import numpy as np
from PIL import Image

from torchvision import transforms
from siamese_model import SiameseNetwork

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_PATH = "models/siamese_muzzle.pt"
DATA_DIR = "data/grouped_cropped_muzzle"
OUT_FILE = "data/embeddings.npy"

# ---------------- Model ----------------
model = SiameseNetwork().to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

# ---------------- Transform (FIXED) ----------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

embeddings = []
labels = []

# ---------------- Extraction ----------------
with torch.no_grad():
    for cattle_id in os.listdir(DATA_DIR):
        class_dir = os.path.join(DATA_DIR, cattle_id)
        if not os.path.isdir(class_dir):
            continue

        for img_name in os.listdir(class_dir):
            img_path = os.path.join(class_dir, img_name)

            img = cv2.imread(img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(img)   # 🔑 KEY FIX

            img = transform(img).unsqueeze(0).to(DEVICE)


            embedding = model.forward_once(img)

            embeddings.append(embedding.cpu().numpy()[0])
            labels.append(cattle_id)

# ---------------- Save ----------------
np.save(
    OUT_FILE,
    {
        "embeddings": np.array(embeddings),
        "labels": np.array(labels)
    }
)

print(f"✅ Saved {len(embeddings)} embeddings to {OUT_FILE}")
