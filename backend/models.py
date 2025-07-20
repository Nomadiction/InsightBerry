# backend/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    result = Column(String)
    confidence = Column(Float)
    timestamp = Column(DateTime)
