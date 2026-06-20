from sqlalchemy import Column, Integer, String
from database import Base

class GraphEdge(Base):
    __tablename__ = "graph_edges"

    edge_id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, index=True)
    source_id = Column(Integer, index=True)
    target_type = Column(String, index=True)
    target_id = Column(Integer, index=True)
    relationship_type = Column(String, index=True)
