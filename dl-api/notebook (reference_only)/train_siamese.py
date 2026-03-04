import os
import torch
from torch.utils.data import DataLoader
from siamese_dataset import SiameseDataset
from siamese_model import SiameseNetwork
from contrastive_loss import ContrastiveLoss

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ✅ FIXED PATH
dataset = SiameseDataset("data/grouped_cropped_muzzle")
loader = DataLoader(dataset, batch_size=16, shuffle=True)

model = SiameseNetwork().to(DEVICE)
criterion = ContrastiveLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

EPOCHS = 40

for epoch in range(EPOCHS):
    total_loss = 0.0

    for img1, img2, label in loader:
        img1 = img1.to(DEVICE)
        img2 = img2.to(DEVICE)
        label = label.to(DEVICE)

        optimizer.zero_grad()
        out1, out2 = model(img1, img2)
        loss = criterion(out1, out2, label)

        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg_loss = total_loss / len(loader)
    print(f"Epoch [{epoch+1}/{EPOCHS}] Loss: {avg_loss:.4f}")

# ✅ SAVE MODEL ONCE
os.makedirs("models", exist_ok=True)
torch.save(model.state_dict(), "models/siamese_muzzle.pt")
print("✅ Siamese model trained and saved")
