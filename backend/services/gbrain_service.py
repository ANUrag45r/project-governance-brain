class GBrainService:
    def store_memory(self, entity_type: str, data: dict):
        # Mock memory storage into Knowledge Graph
        print(f"Storing {entity_type} into GBrain: {data}")

    def query_memory(self, query: str):
        # Mock query
        return f"Results for: {query}"
