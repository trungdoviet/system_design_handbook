from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import urllib.request
import urllib.error
import json
import os

app = FastAPI(title="Tech Mastery Portal API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOPIC_FILES = {
    "system_design": "system_design_quests.json",
    "dsa": "dsa_quests.json",
    "etl": "etl_quests.json",
    "spring": "spring_quests.json"
}

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

class FeedbackRequest(BaseModel):
    topic_id: str
    score: float
    total_completed: int
    total_questions: int
    category_scores: dict

@app.get("/api/topics")
async def get_topics():
    topics = []
    for topic_id, meta in TOPIC_METADATA.items():
        file_path = TOPIC_FILES.get(topic_id)
        count = 0
        if file_path and os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    count = len(data)
            except Exception:
                pass
        topics.append({
            **meta,
            "questions_count": count
        })
    return topics

@app.get("/api/quests/{topic_id}")
async def get_quests(topic_id: str):
    file_path = TOPIC_FILES.get(topic_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Topic not found or database missing.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            quests = json.load(f)
            
        # Return only metadata to keep list requests light
        metadata = []
        for q in quests:
            metadata.append({
                "id": q["id"],
                "title": q["title"],
                "category": q["category"]
            })
        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read database: {str(e)}")

@app.get("/api/quests/{topic_id}/{quest_id}")
async def get_quest_detail(topic_id: str, quest_id: int):
    file_path = TOPIC_FILES.get(topic_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Topic not found.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            quests = json.load(f)
            
        for q in quests:
            if q["id"] == quest_id:
                return q
                
        raise HTTPException(status_code=404, detail="Question not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database read error: {str(e)}")

@app.post("/api/feedback")
async def get_ai_feedback(payload: FeedbackRequest, x_gemini_api_key: str = Header(None)):
    # API key selection: check request headers first, then environment variables
    api_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="Gemini API Key is missing. Please provide it in the API Key settings panel in the top-right corner."
        )
        
    topic_name = TOPIC_METADATA.get(payload.topic_id, {}).get("name", payload.topic_id)
    
    # Construct category breakdown message
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

    # Call Gemini API
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
            
            # Extract content from response
            text_resp = res_json['candidates'][0]['content']['parts'][0]['text']
            return {"feedback": text_resp}
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
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
