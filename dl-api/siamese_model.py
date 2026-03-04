import torch
import torch.nn as nn
import torchvision.models as models

class SiameseNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        # We use your exact ResNet18 setup
        self.encoder = models.resnet18(pretrained=False)
        in_features = self.encoder.fc.in_features
        self.encoder.fc = nn.Linear(in_features, 128)   # MUST BE 128

    def forward_once(self, x):
        """Used for extracting a single embedding (API and extraction script)."""
        return self.encoder(x)

    def forward(self, input1, input2=None):
        """
        Handles both single image inference and dual image training.
        If input2 is provided, it returns two outputs (for your contrastive loss).
        """
        if input2 is None:
            return self.forward_once(input1)
        
        out1 = self.forward_once(input1)
        out2 = self.forward_once(input2)
        return out1, out2