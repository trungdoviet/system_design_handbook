from database import init_db, SessionLocal, User, SpecialistProfile, Quest
import json
import os

def seed_db():
    db_path = "e:/Study/SystemDesign/portal.db"
    if os.path.exists(db_path):
        print(f"Removing existing database at {db_path} for a clean seeding run...")
        try:
            # Close any connections first (though it shouldn't be open in this script process yet)
            os.remove(db_path)
            print("Database removed successfully.")
        except Exception as e:
            print(f"Error removing database: {str(e)}")

    print("Initializing database tables...")
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
                        author_id=None
                    )
                    db.add(quest)
                    count += 1
            db.commit()
            print(f"Seeded {count} quests for topic: {topic}")
            
        # 3. Seed Custom Advanced Questions from technical prep guides
        advanced_quests = [
            {
                "topic_id": "system_design",
                "title": "Preventing Split-Brain in Raft Consensus",
                "category": "Distributed Systems & Locks",
                "scenario": "A 5-node Raft cluster (A, B, C, D, E) gets partitioned: Network split isolates A and B from C, D, and E. Node A was the leader. Node C times out and triggers an election in the majority partition. What happens to leader A when the network recovers?",
                "options": [
                    {"key": "A", "text": "Node A continues as leader and merges its logs with C, D, and E, overwriting conflicting entries on followers."},
                    {"key": "B", "text": "Node A detects a higher Term number from the majority partition upon reconnect, steps down to follower, and rewrites its uncommitted log entries matching Node C's log."},
                    {"key": "C", "text": "The cluster enters a deadlock because both partitions have active leaders with conflicting logs."},
                    {"key": "D", "text": "Node C steps down because Node A has a longer history."}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. A leader cannot overwrite entries on other nodes unless it has a higher Term. Node A has a lower Term.",
                    "B": "Correct. In Raft, Term numbers act as logical clocks. A higher term always overrides a lower term. Since Node A was partitioned, its term remained stagnant while Node C incremented its term to run the election. When they reconnect, Node A steps down and follows Node C, reverting any uncommitted logs.",
                    "C": "Incorrect. Split-brain is prevented by majority quorum requirements. A and B could not commit entries because they lacked quorum (2/5), so no conflicts are committed.",
                    "D": "Incorrect. Node C has a higher Term and majority support, so Node A is forced to step down."
                }
            },
            {
                "topic_id": "system_design",
                "title": "Consistent Hashing Ring Redistribution",
                "category": "Databases & Indexing",
                "scenario": "You are sharding client requests across a database cluster using Consistent Hashing on a ring (0 to 2^32). You have 3 physical nodes (A, B, C) mapped to the ring. Physical Node B crashes. How does Consistent Hashing minimize request redistribution?",
                "options": [
                    {"key": "A", "text": "All requests are re-hashed, redistributing keys uniformly across A and C (100% redistribution)."},
                    {"key": "B", "text": "Only the keys previously mapped to Node B are re-hashed and routed to Node C (the next node clockwise), leaving keys on A and C undisturbed."},
                    {"key": "C", "text": "The system pauses writes and performs a full data partition rebalancing."},
                    {"key": "D", "text": "Node A takes over all of B's traffic, doubling its load."}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. This describes modulo sharding (hash(key) % N), where changing N forces almost all keys to redistribute.",
                    "B": "Correct. In consistent hashing, keys are mapped to a ring and routed to the nearest node clockwise. When Node B fails, only keys that hashed to the segment between A and B are shifted to C. Keys on A and C are unaffected, representing a fraction of 1/N redistribution.",
                    "C": "Incorrect. Consistent hashing is designed specifically to avoid system pauses or full partition rebalances during membership changes.",
                    "D": "Incorrect. The keys shift to the next node clockwise, which is Node C, not Node A."
                }
            },
            {
                "topic_id": "spring",
                "title": "Checked Exception Transaction Rollback",
                "category": "Transactions & AOP",
                "scenario": "You have the following Spring service method. A database update is made, and then an IOException (checked exception) is thrown. What happens to the database update by default?\n\n```java\n@Transactional\npublic void processOrder(Order order) throws IOException {\n    orderRepository.updateStatus(order.getId(), \"PROCESSING\");\n    if (order.getAmount() > 1000) {\n        throw new IOException(\"High amount limits exceeded\");\n    }\n}\n```",
                "options": [
                    {"key": "A", "text": "The transaction is rolled back, and the database status remains unchanged."},
                    {"key": "B", "text": "The transaction commits anyway, and the status updates to 'PROCESSING' because checked exceptions do not trigger rollbacks by default."},
                    {"key": "C", "text": "The database locks the row until the transaction times out."},
                    {"key": "D", "text": "Spring retry intercepts the exception and executes the transaction again."}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. By default, `@Transactional` does not roll back on checked exceptions.",
                    "B": "Correct. Spring's transaction manager rolls back transactions only on unchecked exceptions (RuntimeException and Error) by default. Since IOException is a checked exception, the status remains 'PROCESSING' and commits. To fix, use `@Transactional(rollbackFor = Exception.class)`.",
                    "C": "Incorrect. The connection does not lock the row; it commits and releases the lock.",
                    "D": "Incorrect. `@Transactional` does not have retry capabilities built-in unless combined with `@Retryable`."
                }
            },
            {
                "topic_id": "spring",
                "title": "Spring Boot Circular Reference Resolution",
                "category": "Core & DI",
                "scenario": "Class OrderService needs PaymentService in its constructor, and PaymentService needs OrderService in its constructor. Spring Boot fails to start with BeanCurrentlyInCreationException. Complete the code below to resolve this circular dependency without refactoring:\n\n```java\n@Service\npublic class OrderService {\n    private final PaymentService paymentService;\n    \n    public OrderService(________ PaymentService paymentService) {\n        this.paymentService = paymentService;\n    }\n}\n```",
                "options": [
                    {"key": "A", "text": "@Autowired"},
                    {"key": "B", "text": "@Lazy"},
                    {"key": "C", "text": "@Async"},
                    {"key": "D", "text": "@Qualifier"}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. `@Autowired` is redundant in single-constructor Spring classes and does not solve circular references.",
                    "B": "Correct. `@Lazy` tells Spring to inject a lazy-resolution proxy instead of resolving the actual bean during startup initialization. The proxy resolves the bean on the first method invocation, breaking the startup deadlock.",
                    "C": "Incorrect. `@Async` is for asynchronous method execution, not dependency injection resolution.",
                    "D": "Incorrect. `@Qualifier` resolves bean ambiguity when multiple beans of the same type exist, it doesn't break startup deadlocks."
                }
            },
            {
                "topic_id": "dsa",
                "title": "LRU Cache Node Eviction",
                "category": "Design & Data Structures",
                "scenario": "You have an LRU cache with capacity 3. Operations are executed: put(1, 1), put(2, 2), put(3, 3), get(1), put(4, 4). What is the state of the cache keys from most recently used (MRU) to least recently used (LRU) at the end?",
                "options": [
                    {"key": "A", "text": "[4, 3, 1] (Key 2 is evicted)"},
                    {"key": "B", "text": "[4, 1, 3] (Key 2 is evicted)"},
                    {"key": "C", "text": "[4, 1, 2] (Key 3 is evicted)"},
                    {"key": "D", "text": "[4, 3, 2] (Key 1 is evicted)"}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. `get(1)` moves 1 to the head (MRU), making it more recently used than 3.",
                    "B": "Correct. Let's trace:\n1. `put(1,1)` -> [1]\n2. `put(2,2)` -> [2, 1]\n3. `put(3,3)` -> [3, 2, 1]\n4. `get(1)` -> [1, 3, 2] (Key 1 moves to head)\n5. `put(4,4)` -> Cache full. Evict tail (Key 2) -> Add 4 to head -> [4, 1, 3].",
                    "C": "Incorrect. Key 3 was accessed more recently than Key 2, so Key 2 is evicted, not Key 3.",
                    "D": "Incorrect. Key 1 was read, so it cannot be evicted over Key 2."
                }
            },
            {
                "topic_id": "etl",
                "title": "Spark Broadcast Join Optimization",
                "category": "Batch Processing",
                "scenario": "You are joining a large table UserActions (10TB) with a small table ZipCodes (5MB). A standard shuffle join triggers executor OOMs. Complete the PySpark code to optimize this join:\n\n```python\nfrom pyspark.sql.functions import ________\n\njoined_df = user_actions_df.join(\n    ________(zip_codes_df),\n    \"zip_code\"\n)\n```",
                "options": [
                    {"key": "A", "text": "repartition / repartition"},
                    {"key": "B", "text": "broadcast / broadcast"},
                    {"key": "C", "text": "coalesce / coalesce"},
                    {"key": "D", "text": "cache / cache"}
                ],
                "correct_answer": "B",
                "explanations": {
                    "A": "Incorrect. Repartitioning triggers network shuffle, which is the source of OOM bottlenecks at 10TB scale.",
                    "B": "Correct. Broadcasting the small table (5MB) replicates it to all executors. Each worker performs a map-side join locally, completely avoiding shuffling the 10TB table.",
                    "C": "Incorrect. Coalesce is for reducing partitions, it doesn't represent join strategies.",
                    "D": "Incorrect. Caching stores the table in memory but does not prevent Spark from triggering a shuffle join."
                }
            }
        ]

        count_adv = 0
        for aq in advanced_quests:
            existing_quest = db.query(Quest).filter(
                Quest.topic_id == aq["topic_id"],
                Quest.title == aq["title"]
            ).first()
            
            if not existing_quest:
                quest = Quest(
                    topic_id=aq["topic_id"],
                    title=aq["title"],
                    category=aq["category"],
                    scenario=aq["scenario"],
                    options=json.dumps(aq["options"], ensure_ascii=False),
                    correct_answer=aq["correct_answer"],
                    explanations=json.dumps(aq["explanations"], ensure_ascii=False),
                    status="published",
                    author_id=None
                )
                db.add(quest)
                count_adv += 1
                
        db.commit()
        print(f"Seeded {count_adv} advanced technical questions successfully.")
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
