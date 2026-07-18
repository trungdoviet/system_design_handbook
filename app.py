from fastapi import FastAPI, HTTPException, Header, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import urllib.request
import urllib.error
import json
import os

from sqlalchemy.orm import Session
from database import get_db, User, SpecialistProfile, Quest, UserProgress, Rating, ReviewNote, CoinTransaction

app = FastAPI(title="Tech Mastery Portal API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOPIC_METADATA = {
    "system_design": {
        "id": "system_design",
        "name": "System Design Questions",
        "description": "Based on '60 Days of System Design Questions' eBook. Test your knowledge on architecture, performance, database scaling, caching, and resiliency.",
        "icon": "🌐",
        "status": "active"
    },
    "dsa": {
        "id": "dsa",
        "name": "Data Structures & Algorithms",
        "description": "Practice optimization, arrays, search, sorting, tree traversals, and dynamic programming questions.",
        "icon": "🧠",
        "status": "active"
    },
    "etl": {
        "id": "etl",
        "name": "ETL & Data Engineering Pipelines",
        "description": "Master stream processing, batch joins, watermarking, data warehousing, and idempotent data pipelines.",
        "icon": "📊",
        "status": "active"
    },
    "spring": {
        "id": "spring",
        "name": "Spring Framework & Enterprise Java",
        "description": "Test your expertise on Dependency Injection, Spring Boot transactions, AOP, JPA/Hibernate performance, and security.",
        "icon": "🌱",
        "status": "active"
    }
}

# Specialist Level Progression boundaries
SPECIALIST_LEVELS = [
    {"level": 1, "min_xp": 0},
    {"level": 2, "min_xp": 50},
    {"level": 3, "min_xp": 150},
    {"level": 4, "min_xp": 300},
    {"level": 5, "min_xp": 500},
    {"level": 6, "min_xp": 750},
    {"level": 7, "min_xp": 1050},
    {"level": 8, "min_xp": 1400},
    {"level": 9, "min_xp": 1800},
    {"level": 10, "min_xp": 2250}
]

def get_specialist_level(xp: int) -> int:
    current_level = 1
    for lvl in SPECIALIST_LEVELS:
        if xp >= lvl["min_xp"]:
            current_level = lvl["level"]
        else:
            break
    return current_level

# Helper to retrieve active user context from request header
def get_current_user(db: Session = Depends(get_db), x_user_email: str = Header(None)):
    email = x_user_email or "student@mastery.edu"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto create student fallback if deleted
        user = User(email=email, name="Fallback User", role="user")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# ==========================================================================
# Schema validation models
# ==========================================================================
class AuthLoginPayload(BaseModel):
    email: str

class QuestProgressPayload(BaseModel):
    answered: str
    correct: bool

class QuestSubmissionPayload(BaseModel):
    topic_id: str
    title: str
    category: str
    scenario: str
    options: List[Dict[str, str]] # [{'key': 'A', 'text': '...'}]
    correct_answer: str
    explanations: Dict[str, str] # {'A': '...', 'B': '...'}

class CommentPayload(BaseModel):
    note_text: str

class RatePayload(BaseModel):
    rating_val: int # 1 to 5 stars
    feedback: Optional[str] = None

class FeedbackRequest(BaseModel):
    topic_id: str
    score: float
    total_completed: int
    total_questions: int
    category_scores: dict

# ==========================================================================
# Auth API Endpoints
# ==========================================================================
@app.get("/api/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    spec_lvl = 1
    spec_xp = 0
    if user.role == "specialist" and user.specialist_profile:
        spec_lvl = user.specialist_profile.level
        spec_xp = user.specialist_profile.xp
        
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "coin_balance": user.coin_balance,
        "avatar_url": user.avatar_url,
        "specialist_level": spec_lvl if user.role == "specialist" else None,
        "specialist_xp": spec_xp if user.role == "specialist" else None
    }

@app.post("/api/auth/login-dev")
async def auth_login_dev(payload: AuthLoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Test account not found in database.")
    return {"status": "ok", "email": user.email}

@app.get("/api/auth/test-users")
async def get_test_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    results = []
    for u in users:
        lvl = u.specialist_profile.level if u.role == "specialist" and u.specialist_profile else None
        results.append({
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "specialist_level": lvl
        })
    return results

# ==========================================================================
# Topic & Quest Retrieval Endpoints
# ==========================================================================
@app.get("/api/topics")
async def get_topics(db: Session = Depends(get_db)):
    topics = []
    for topic_id, meta in TOPIC_METADATA.items():
        count = db.query(Quest).filter(Quest.topic_id == topic_id, Quest.status == "published").count()
        topics.append({
            **meta,
            "questions_count": count
        })
    return topics

@app.get("/api/quests/{topic_id}")
async def get_quests(topic_id: str, db: Session = Depends(get_db)):
    quests = db.query(Quest).filter(Quest.topic_id == topic_id, Quest.status == "published").all()
    metadata = []
    for q in quests:
        metadata.append({
            "id": q.id,
            "title": q.title,
            "category": q.category
        })
    return metadata

@app.get("/api/quests/{topic_id}/{quest_id}")
async def get_quest_detail(topic_id: str, quest_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Quest).filter(Quest.topic_id == topic_id, Quest.id == quest_id, Quest.status == "published").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
        
    # Check if user previously solved it
    solved = db.query(UserProgress).filter(UserProgress.user_id == user.id, UserProgress.quest_id == q.id).first()
    previous_ans = None
    if solved:
        previous_ans = {
            "answered": solved.answered,
            "correct": solved.correct
        }

    # Fetch ratings details
    ratings = db.query(Rating).filter(Rating.quest_id == q.id).all()
    avg_rating = 0
    if ratings:
        avg_rating = sum(r.rating_val for r in ratings) / len(ratings)

    return {
        "id": q.id,
        "title": q.title,
        "category": q.category,
        "scenario": q.scenario,
        "options": json.loads(q.options),
        "correct_answer": q.correct_answer,
        "explanations": json.loads(q.explanations),
        "author_id": q.author_id,
        "previous_answer": previous_ans,
        "rating_stats": {
            "count": len(ratings),
            "average": round(avg_rating, 1)
        }
    }

# Save user progress on completing a question
@app.post("/api/quests/{topic_id}/{quest_id}/progress")
async def save_quest_progress(topic_id: str, quest_id: int, payload: QuestProgressPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(UserProgress).filter(UserProgress.user_id == user.id, UserProgress.quest_id == quest_id).first()
    if existing:
        existing.answered = payload.answered
        existing.correct = payload.correct
    else:
        progress = UserProgress(
            user_id=user.id,
            quest_id=quest_id,
            topic_id=topic_id,
            answered=payload.answered,
            correct=payload.correct
        )
        db.add(progress)
    db.commit()
    return {"status": "ok"}

@app.get("/api/user/progress/{topic_id}")
async def get_user_progress_list(topic_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    prog = db.query(UserProgress).filter(UserProgress.user_id == user.id, UserProgress.topic_id == topic_id).all()
    results = {}
    for p in prog:
        results[p.quest_id] = {
            "answered": p.answered,
            "correct": p.correct
        }
    return results

# ==========================================================================
# Question Submission & Community Pipelines (Coins & Moderation)
# ==========================================================================
@app.post("/api/submissions")
async def submit_quest(payload: QuestSubmissionPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quest = Quest(
        topic_id=payload.topic_id,
        title=payload.title,
        category=payload.category,
        scenario=payload.scenario,
        options=json.dumps(payload.options, ensure_ascii=False),
        correct_answer=payload.correct_answer,
        explanations=json.dumps(payload.explanations, ensure_ascii=False),
        author_id=user.id,
        status="pending_review"
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    
    # Save a System Review Note
    note = ReviewNote(
        quest_id=quest.id,
        user_id=user.id,
        author_name=user.name,
        note_text=f"Question submitted by {user.name}. Status: Pending Review."
    )
    db.add(note)
    db.commit()
    
    return {"status": "ok", "quest_id": quest.id}

@app.get("/api/submissions/pending")
async def get_pending_submissions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in ["specialist", "admin"]:
        raise HTTPException(status_code=403, detail="Only specialists or administrators can view pending moderation reviews.")
        
    quests = db.query(Quest).filter(Quest.status == "pending_review").all()
    results = []
    for q in quests:
        author = db.query(User).filter(User.id == q.author_id).first()
        results.append({
            "id": q.id,
            "title": q.title,
            "topic_id": q.topic_id,
            "category": q.category,
            "author_name": author.name if author else "Anonymous",
            "created_at": q.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results

@app.get("/api/submissions/{quest_id}")
async def get_submission_detail(quest_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Quest).filter(Quest.id == quest_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    if user.role not in ["specialist", "admin"] and q.author_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this submission details.")
        
    notes = db.query(ReviewNote).filter(ReviewNote.quest_id == q.id).order_by(ReviewNote.created_at.asc()).all()
    notes_list = []
    for n in notes:
        notes_list.append({
            "author_name": n.author_name,
            "note_text": n.note_text,
            "created_at": n.created_at.strftime("%H:%M %p, %Y-%m-%d")
        })

    return {
        "id": q.id,
        "topic_id": q.topic_id,
        "title": q.title,
        "category": q.category,
        "scenario": q.scenario,
        "options": json.loads(q.options),
        "correct_answer": q.correct_answer,
        "explanations": json.loads(q.explanations),
        "author_id": q.author_id,
        "status": q.status,
        "notes": notes_list
    }

@app.post("/api/submissions/{quest_id}/comment")
async def add_review_comment(quest_id: int, payload: CommentPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Quest).filter(Quest.id == quest_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    if user.role not in ["specialist", "admin"] and q.author_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized action.")

    note = ReviewNote(
        quest_id=q.id,
        user_id=user.id,
        author_name=user.name,
        note_text=payload.note_text
    )
    db.add(note)
    db.commit()
    return {"status": "ok"}

@app.post("/api/submissions/{quest_id}/edit")
async def edit_submission(quest_id: int, payload: QuestSubmissionPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Quest).filter(Quest.id == quest_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    if user.role not in ["specialist", "admin"] and q.author_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized action.")

    # Record changes details
    changes_msg = f"Question updated by {user.name}."
    
    q.title = payload.title
    q.category = payload.category
    q.scenario = payload.scenario
    q.options = json.dumps(payload.options, ensure_ascii=False)
    q.correct_answer = payload.correct_answer
    q.explanations = json.dumps(payload.explanations, ensure_ascii=False)
    
    note = ReviewNote(
        quest_id=q.id,
        user_id=user.id,
        author_name=user.name,
        note_text=changes_msg
    )
    db.add(note)
    db.commit()
    return {"status": "ok"}

@app.post("/api/submissions/{quest_id}/approve")
async def approve_quest(quest_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in ["specialist", "admin"]:
        raise HTTPException(status_code=403, detail="Only specialists or administrators can approve submissions.")
        
    q = db.query(Quest).filter(Quest.id == quest_id, Quest.status == "pending_review").first()
    if not q:
        raise HTTPException(status_code=404, detail="Pending submission not found.")

    # Determine approving specialist level
    is_admin = user.role == "admin"
    spec_lvl = 1
    if user.role == "specialist" and user.specialist_profile:
        spec_lvl = user.specialist_profile.level

    # Check approval rules
    # If Level >= 5 or admin, approve instantly.
    # Otherwise, check existing approve notes to see if another specialist already voted.
    already_approved_by_me = db.query(ReviewNote).filter(
        ReviewNote.quest_id == q.id,
        ReviewNote.user_id == user.id,
        ReviewNote.note_text.contains("approved")
    ).first()
    
    if already_approved_by_me:
        raise HTTPException(status_code=400, detail="You have already approved this submission.")

    # Append approval note
    note = ReviewNote(
        quest_id=q.id,
        user_id=user.id,
        author_name=user.name,
        note_text=f"Approved by {user.name} (Specialist Level {spec_lvl})."
    )
    db.add(note)
    
    # Calculate total approvals
    approval_notes = db.query(ReviewNote).filter(
        ReviewNote.quest_id == q.id,
        ReviewNote.note_text.contains("Approved by")
    ).all()
    
    approvals_count = len(approval_notes) + 1 # Include current approval vote
    
    # Fully publish condition
    if is_admin or spec_lvl >= 5 or approvals_count >= 2:
        q.status = "published"
        q.approved_by = user.id
        
        # Earn Coin Flow for publishing (+50 coins reward)
        author = db.query(User).filter(User.id == q.author_id).first()
        if author:
            author.coin_balance += 50
            tx = CoinTransaction(
                user_id=author.id,
                amount=50,
                description=f"Reward for published question: '{q.title}'"
            )
            db.add(tx)
            
        note_publish = ReviewNote(
            quest_id=q.id,
            user_id=user.id,
            author_name="System",
            note_text=f"Question officially published by {user.name}. Author rewarded +50 coins."
        )
        db.add(note_publish)
        db.commit()
        return {"status": "published", "approvals": approvals_count}
    else:
        db.commit()
        return {"status": "voted", "approvals": approvals_count, "detail": "Voted! Question requires 1 more approval from another peer specialist to fully publish."}

# ==========================================================================
# Rating & Star Coin Flow Endpoints
# ==========================================================================
@app.post("/api/quests/{topic_id}/{quest_id}/rate")
async def rate_quest(topic_id: str, quest_id: int, payload: RatePayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Quest).filter(Quest.id == quest_id, Quest.status == "published").first()
    if not q:
        raise HTTPException(status_code=404, detail="Published question not found.")
        
    if payload.rating_val < 1 or payload.rating_val > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars.")

    # Record rating
    rating = Rating(
        quest_id=q.id,
        user_id=user.id,
        rating_val=payload.rating_val,
        feedback=payload.feedback
    )
    db.add(rating)
    
    # COIN & EXPERIENCES SYSTEM:
    # 1. Author receives ratings stars as coins
    author = db.query(User).filter(User.id == q.author_id).first() if q.author_id else None
    if author:
        author.coin_balance += payload.rating_val
        tx = CoinTransaction(
            user_id=author.id,
            amount=payload.rating_val,
            description=f"Earned {payload.rating_val} coins from user rating on '{q.title}'"
        )
        db.add(tx)
        
    # 2. Approving Specialist receives XP toward levels
    if q.approved_by:
        specialist = db.query(User).filter(User.id == q.approved_by).first()
        if specialist and specialist.role == "specialist" and specialist.specialist_profile:
            profile = specialist.specialist_profile
            profile.xp += payload.rating_val
            
            # Check Level Up
            old_level = profile.level
            new_level = get_specialist_level(profile.xp)
            if new_level > old_level:
                profile.level = new_level
                # Log a transaction/system note if necessary
                tx_xp = CoinTransaction(
                    user_id=specialist.id,
                    amount=0,
                    description=f"Level upgraded to {new_level}! Star approved milestones achieved."
                )
                db.add(tx_xp)
                
    db.commit()
    return {"status": "ok"}

# ==========================================================================
# Gemini LLM Diagnostic Feedback Custom API
# ==========================================================================
@app.post("/api/feedback")
async def get_ai_feedback(payload: FeedbackRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user), x_gemini_api_key: str = Header(None)):
    api_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    
    # If no key, attempt Coin Payment bypass (10 coins)
    coin_bypass_used = False
    if not api_key:
        if user.coin_balance >= 10:
            api_key = os.environ.get("SYSTEM_GEMINI_API_KEY") # Serve LLM from server budget
            if not api_key:
                # If server key not configured, fallback to standard error
                raise HTTPException(
                    status_code=400,
                    detail="Server budget key is missing. Please configure your API key in settings."
                )
            user.coin_balance -= 10
            coin_bypass_used = True
            
            tx = CoinTransaction(
                user_id=user.id,
                amount=-10,
                description="Redeemed 10 coins for AI Diagnostic Architect Review"
            )
            db.add(tx)
            db.commit()
        else:
            raise HTTPException(
                status_code=400, 
                detail="You need either 10 coins or a custom Gemini API Key in your Settings modal (top-right key icon) to generate this report."
            )
        
    topic_name = TOPIC_METADATA.get(payload.topic_id, {}).get("name", payload.topic_id)
    
    category_summary = ""
    for cat, stats in payload.category_scores.items():
        correct = stats.get("correct", 0)
        total = stats.get("total", 0)
        pct = (correct / total * 100) if total > 0 else 0
        category_summary += f"- **{cat}**: {correct}/{total} correct ({pct:.1f}%)\n"

    prompt = f"""
    You are Antigravity, a Senior System Design Architect and technical instructor.
    A student has just completed a quiz session in the topic "{topic_name}".
    Here are their results:
    - **Overall Score**: {payload.score:.1f}% ({payload.total_completed} completed out of {payload.total_questions} total questions).
    
    ### Component/Category Breakdown:
    {category_summary}
    
    Please provide a concise, high-impact review of their performance. Organize your feedback into the following sections:
    1. **Overview & Skill Tier Assessment**: Briefly evaluate their overall understanding. Classify their strength level (e.g., Novice Architect, Competent Practitioner, Staff Designer).
    2. **Key Strengths**: Identify which areas they excelled in based on their high scores.
    3. **Growth Areas & Traps**: Highlight components where they struggled or fell for common pitfalls (scores below 80% or where they had errors).
    4. **Concrete Action Plan**: Give 2-3 specific, practical recommendations on how they can enhance their knowledge in their weak spots (e.g., specific architectures to review, system interactions to simulate).
    
    Use a professional, encouraging, yet rigorous tone. Keep the output formatted in beautiful, readable Markdown.
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    
    req_body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            text_resp = res_json['candidates'][0]['content']['parts'][0]['text']
            return {"feedback": text_resp, "coin_bypass": coin_bypass_used}
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_msg)
            message = error_json.get("error", {}).get("message", "API Error")
        except Exception:
            message = error_msg
        raise HTTPException(status_code=e.code, detail=f"Gemini API Error: {message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with LLM: {str(e)}")

# Mount static folder
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
