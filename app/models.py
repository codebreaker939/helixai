from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    disease = Column(String)