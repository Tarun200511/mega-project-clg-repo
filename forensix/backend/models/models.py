from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.config import Base
import datetime


class Case(Base):
    __tablename__ = "cases"

    id            = Column(Integer, primary_key=True, index=True)
    case_number   = Column(String(20), unique=True, index=True, nullable=False)
    title         = Column(String(255), index=True, nullable=False)
    description   = Column(Text, nullable=True)
    location      = Column(String(255), nullable=True)
    investigator  = Column(String(255), nullable=True)
    status        = Column(String(50), default="Open")       # Open | Closed | Pending
    priority      = Column(String(20), default="Medium")     # Low | Medium | High | Critical
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Evidence & Results
    evidence_image_url = Column(String(512), nullable=True)
    ai_results         = Column(JSON, nullable=True)

    # Flags summaries for fast dashboard queries
    weapon_detected = Column(Boolean, default=False)
    blood_detected  = Column(Boolean, default=False)
    face_detected   = Column(Boolean, default=False)
    threat_level    = Column(Float, default=0.0)   # 0-100

    # Relations
    evidence = relationship("EvidenceItem", back_populates="case", cascade="all, delete-orphan")
    report   = relationship("Report", back_populates="case", uselist=False, cascade="all, delete-orphan")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id          = Column(Integer, primary_key=True, index=True)
    case_id     = Column(Integer, ForeignKey("cases.id"), nullable=False)
    file_url    = Column(String(512), nullable=False)
    file_type   = Column(String(50))   # image | video
    ai_results  = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="evidence")


class Report(Base):
    __tablename__ = "reports"

    id          = Column(Integer, primary_key=True, index=True)
    case_id     = Column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    file_path   = Column(String(512), nullable=True)
    created_at  = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="report")
