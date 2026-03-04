import chromadb
from typing import List, Dict, Any

class CattleVectorStore:
    def __init__(self, db_path: str = "./chroma_data"):
        # This creates a persistent database folder in your project
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name="cattle_embeddings",
            metadata={"hnsw:space": "cosine"} # Use cosine similarity
        )

    def add_embedding(self, embedding: List[float], cow_id: str, farmer_id: str, source: str):
        vector_id = f"{cow_id}_{source}" 
        self.collection.add(
            embeddings=[embedding],
            metadatas=[{"cow_id": cow_id, "farmer_id": farmer_id, "source": source}],
            ids=[vector_id]
        )

    def search(self, embedding: List[float], user_id: str, role: str, top_k: int = 1) -> Dict[str, Any]:
        # Filter metadata based on role
        where_filter = {"farmer_id": user_id} if role == "farmer" else None

        results = self.collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            where=where_filter
        )
        
        if not results['ids'] or len(results['ids'][0]) == 0:
            return {"found": False, "message": "No matching cattle found in the specified database."}
            
        return {
            "found": True,
            "cow_id": results['metadatas'][0][0]['cow_id'],
            "distance": results['distances'][0][0]
        }