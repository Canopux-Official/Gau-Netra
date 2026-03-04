import os
import cv2
from ultralytics import YOLO

# -------- PATHS --------
IMAGE_DIR = "data/yolo_dataset/images_all_flat"
OUT_DIR = "data/cropped_muzzles"
MODEL_PATH = "runs/detect/muzzle_yolo/weights/best.pt"

os.makedirs(OUT_DIR, exist_ok=True)

# -------- LOAD MODEL --------
model = YOLO(MODEL_PATH)

# -------- RUN PREDICTION --------
results = model.predict(
    source=IMAGE_DIR,
    imgsz=640,
    conf=0.25,
    device="cpu",
    stream=True
)

count = 0

# -------- CROP --------
for r in results:
    img = r.orig_img
    h, w = img.shape[:2]

    if r.boxes is None:
        continue

    base_name = os.path.splitext(os.path.basename(r.path))[0]

    for box in r.boxes.xyxy:
        x1, y1, x2, y2 = map(int, box)

        # clip to image size (important!)
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        filename = f"{base_name}_muzzle_{count}.jpg"
        save_path = os.path.join(OUT_DIR, filename)

        cv2.imwrite(save_path, crop)
        count += 1

print(f"✅ Cropping done. Total cropped muzzles: {count}")
