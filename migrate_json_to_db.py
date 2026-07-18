from database import init_db, SessionLocal, User, SpecialistProfile, Quest
import json
import os

def seed_db():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        # 1. Seed Developer Test Accounts
        test_users = [
            {"email": "student@mastery.edu", "name": "Alice (Student)", "role": "user", "coin_balance": 100},
            {"email": "author@mastery.edu", "name": "Bob (Author)", "role": "user", "coin_balance": 50},
            {"email": "spec2@mastery.edu", "name": "Charlie (Spec Lvl 2)", "role": "specialist", "coin_balance": 150, "level": 2, "xp": 85},
            {"email": "spec6@mastery.edu", "name": "Diana (Spec Lvl 6)", "role": "specialist", "coin_balance": 300, "level": 6, "xp": 850},
            {"email": "admin@mastery.edu", "name": "Admin Manager", "role": "admin", "coin_balance": 9999}
        ]
        
        seeded_users = {}
        for user_data in test_users:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                user = User(
                    email=user_data["email"],
                    name=user_data["name"],
                    role=user_data["role"],
                    coin_balance=user_data["coin_balance"],
                    avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={user_data['name'].replace(' ', '_')}"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # If specialist, seed profile
                if user.role == "specialist":
                    prof = SpecialistProfile(
                        user_id=user.id,
                        category="all",
                        level=user_data["level"],
                        xp=user_data["xp"]
                    )
                    db.add(prof)
                    db.commit()
                
                seeded_users[user.email] = user
                print(f"Seeded User: {user.name} ({user.role})")
            else:
                seeded_users[existing.email] = existing
                
        # 2. Seed Quest files
        topics = ["system_design", "dsa", "etl", "spring"]
        for topic in topics:
            file_name = f"{topic}_quests.json"
            if not os.path.exists(file_name):
                print(f"Warning: Quest file {file_name} not found. Skipping seeding for this topic.")
                continue
                
            with open(file_name, "r", encoding="utf-8") as f:
                quests_data = json.load(f)
                
            count = 0
            for q in quests_data:
                # Check if already seeded in DB
                existing_quest = db.query(Quest).filter(
                    Quest.topic_id == topic,
                    Quest.title == q["title"]
                ).first()
                
                if not existing_quest:
                    quest = Quest(
                        id=q["id"] if topic == "system_design" else None, # preserve IDs for day index
                        topic_id=topic,
                        title=q["title"],
                        category=q.get("category", "General"),
                        scenario=q["scenario"],
                        options=json.dumps(q["options"], ensure_ascii=False),
                        correct_answer=q["correct_answer"],
                        explanations=json.dumps(q["explanations"], ensure_ascii=False),
                        status="published",
                        author_id=None # Seeded questions have no author
                    )
                    db.add(quest)
                    count += 1
            db.commit()
            print(f"Seeded {count} quests for topic: {topic}")
            
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
