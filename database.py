from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime

DATABASE_URL = "sqlite:///e:/Study/SystemDesign/portal.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    role = Column(String, default="user") # "user" | "specialist" | "admin"
    coin_balance = Column(Integer, default=100) # Give 100 starting coins to test LLM reviews
    avatar_url = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    specialist_profile = relationship("SpecialistProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class SpecialistProfile(Base):
    __tablename__ = "specialist_profiles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    category = Column(String, default="all") # "all" or specific category name
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0) # total rating stars approved
    
    user = relationship("User", back_populates="specialist_profile")

class Quest(Base):
    __tablename__ = "quests"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(String, index=True)
    title = Column(String)
    category = Column(String, index=True)
    scenario = Column(String)
    options = Column(String) # JSON string representation
    correct_answer = Column(String)
    explanations = Column(String) # JSON string representation
    
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="published") # "draft" | "pending_review" | "published"
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    ratings = relationship("Rating", back_populates="quest", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="quest", cascade="all, delete-orphan")
    review_notes = relationship("ReviewNote", back_populates="quest", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"), index=True)
    topic_id = Column(String, index=True)
    answered = Column(String)
    correct = Column(Boolean)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="progress")
    quest = relationship("Quest", back_populates="progress")

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rating_val = Column(Integer) # 1 to 5
    feedback = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="ratings")
    quest = relationship("Quest", back_populates="ratings")

class ReviewNote(Base):
    __tablename__ = "review_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True) # specialist ID
    author_name = Column(String) # cache name at review time
    note_text = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    quest = relationship("Quest", back_populates="review_notes")

class CoinTransaction(Base):
    __tablename__ = "coin_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Integer)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
