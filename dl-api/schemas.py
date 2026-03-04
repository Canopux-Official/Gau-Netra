from pydantic import BaseModel

class RegistrationRequest(BaseModel):
    farmer_id: str
    cow_id: str
    face_image: str
    muzzle_image: str  # Updated to expect a URL/Link

class SearchRequest(BaseModel):
    user_id: str
    role: str  # "farmer" or "admin"
    face_image: str
    muzzle_image: str