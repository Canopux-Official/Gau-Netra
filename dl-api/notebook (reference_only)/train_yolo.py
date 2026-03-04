from ultralytics import YOLO

# Load pretrained YOLOv8 model
model = YOLO("yolov8s.pt")

# Train the model
model.train(
    data="data/yolo_dataset/data.yaml",
    epochs=10,
    imgsz=640,
    batch=16,
    device="cpu",
    workers=2,
    project="runs/detect",
    name="muzzle_yolo",
    save=True
)

