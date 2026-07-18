import fitz
import re
import os
import json

def get_day_pages(doc):
    system_design_pages = {}
    answers_pages = {}
    
    for i in range(len(doc)):
        text = doc[i].get_text()
        sd_match = re.search(r'^\s*DAY\s+(\d+)\s*·\s*SYSTEM\s+DESIGN', text, re.IGNORECASE | re.MULTILINE)
        if sd_match:
            system_design_pages[int(sd_match.group(1))] = i
        ans_match = re.search(r'^\s*DAY\s+(\d+)\s*·\s*ANSWERS\s+&\s+EXPLANATIONS', text, re.IGNORECASE | re.MULTILINE)
        if ans_match:
            answers_pages[int(ans_match.group(1))] = i
            
    return system_design_pages, answers_pages

def categorize_day(day_num, title, scenario):
    title_lower = title.lower()
    scenario_lower = scenario.lower()
    text = title_lower + " " + scenario_lower

    if any(k in text for k in ['cache', 'redis', 'bloom', 'stampede', 'memcached', 'varnish']):
        return "Caching & Performance"
    elif any(k in text for k in ['sharding', 'shard', 'index', 'postgres', 'postgres15', 'postgres 15', 'mysql', 'table', 'db', 'database', 'nosql', 'connection pool', 'pgbouncer', 'query', 'orm', 'n+1', 'dynamodb', 'cassandra', 'replica', 'primary', 'schema', 'sql']):
        if any(k in text for k in ['transaction', 'saga', 'lock', 'outbox', '2pc', 'consistency']):
            return "Distributed Systems & Locks"
        return "Databases & Indexing"
    elif any(k in text for k in ['lock', 'cron', 'saga', 'transaction', '2pc', 'outbox', 'consensus', 'consistency', 'distributed', 'two generals']):
        return "Distributed Systems & Locks"
    elif any(k in text for k in ['kafka', 'queue', 'message', 'sqs', 'stream', 'event', 'flink', 'consumer', 'topic', 'backpressure']):
        return "Messaging & Streams"
    elif any(k in text for k in ['circuit breaker', 'bulkhead', 'rate limit', 'feature flag', 'canary', 'blue-green', 'blue/green', 'timeout', 'retry', 'retries', 'failover', 'security', 'vault', 'kms', 'secrets', 'token bucket', 'leaky bucket', 'fixed window', 'sliding window']):
        return "Resilience & Deployment"
    else:
        return "API Design & Routing"

def clean_text(text):
    clean_lines = []
    for l in text.split('\n'):
        l_strip = l.strip()
        if not l_strip:
            continue
        # Filter page numbers or headers
        if re.match(r'^\d+$', l_strip):
            continue
        if "SYSTEM DESIGN" in l_strip or "ANSWERS & EXPLANATIONS" in l_strip:
            continue
        clean_lines.append(l_strip)
    return " ".join(clean_lines)

def parse_pdf():
    pdf_path = r"e:\Study\SystemDesign\system-design-questions-ebook.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return
        
    doc = fitz.open(pdf_path)
    sd_pages, ans_pages = get_day_pages(doc)
    
    quests = []
    
    for day in sorted(sd_pages.keys()):
        sd_start = sd_pages[day]
        sd_end = ans_pages[day]
        
        # System design pages
        sd_text = ""
        for p in range(sd_start, sd_end):
            sd_text += doc[p].get_text() + "\n"
            
        lines = [l.strip() for l in sd_text.split('\n') if l.strip()]
        title = lines[1] if len(lines) > 1 else f"Day {day:02d} Quest"
        
        # Find option indices
        option_indices = {}
        for letter in ['A', 'B', 'C', 'D']:
            for idx, line in enumerate(lines):
                if line == letter or re.match(rf'^{letter}\s*[\)·\-\—\.\)]', line):
                    option_indices[letter] = idx
                    break
                    
        idx_a = option_indices.get('A')
        idx_b = option_indices.get('B')
        idx_c = option_indices.get('C')
        idx_d = option_indices.get('D')
        
        scenario = "\n".join(lines[2:idx_a]).strip()
        
        opt_a = clean_text("\n".join(lines[idx_a+1:idx_b]))
        opt_b = clean_text("\n".join(lines[idx_b+1:idx_c]))
        opt_c = clean_text("\n".join(lines[idx_c+1:idx_d]))
        opt_d = clean_text("\n".join(lines[idx_d+1:]))
        
        # Answers pages
        ans_start = ans_pages[day]
        ans_end = sd_pages.get(day + 1, len(doc))
        
        ans_text = ""
        for p in range(ans_start, ans_end):
            ans_text += doc[p].get_text() + "\n"
            
        blocks = re.split(r'^\s*(?:Answer|Option)\s+\d+\s*$', ans_text, flags=re.IGNORECASE | re.MULTILINE)
        exp_blocks = [b.strip() for b in blocks[1:] if b.strip()]
        
        correct_answer = None
        explanations = {}
        
        for idx, block in enumerate(exp_blocks):
            blines = [l.strip() for l in block.split('\n') if l.strip()]
            if not blines:
                continue
                
            test_text = "\n".join(blines[:5])
            found_letter = None
            
            # Heuristics for letter mapping
            m1 = re.search(r'\bWhy\s+([A-D])\b', test_text, re.IGNORECASE)
            if m1:
                found_letter = m1.group(1).upper()
                
            if not found_letter:
                m2 = re.search(r'(?:Answer|Option|Correct Answer)\s*[:—\-]?\s*([A-D])\b', test_text, re.IGNORECASE)
                if m2:
                    found_letter = m2.group(1).upper()
                    
            if not found_letter:
                m3 = re.search(r'^\s*([A-D])\s*[\)—\-—·]', test_text, re.IGNORECASE | re.MULTILINE)
                if m3:
                    found_letter = m3.group(1).upper()
                    
            if not found_letter:
                m4 = re.search(r'^\s*([A-D])\b', test_text, re.IGNORECASE)
                if m4:
                    found_letter = m4.group(1).upper()
            
            # If this block is the first one, it is the correct answer
            if idx == 0 and found_letter:
                correct_answer = found_letter
                
            if found_letter:
                explanations[found_letter] = block.strip()
                
        category = categorize_day(day, title, scenario)
        
        quests.append({
            "id": day,
            "title": title,
            "category": category,
            "scenario": scenario,
            "options": [
                {"key": "A", "text": opt_a},
                {"key": "B", "text": opt_b},
                {"key": "C", "text": opt_c},
                {"key": "D", "text": opt_d}
            ],
            "correct_answer": correct_answer,
            "explanations": explanations
        })
        
    # Write System Design quests
    output_path = r"e:\Study\SystemDesign\system_design_quests.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(quests, f, indent=2, ensure_ascii=False)
    print(f"Generated {len(quests)} System Design quests in {output_path}")

def generate_mock_quests():
    # 1. DSA Quests
    dsa_quests = [
        {
            "id": 1,
            "title": "Finding Duplicates in a Read-Only Array",
            "category": "Array & Sorting",
            "scenario": "You are given a read-only array of n + 1 integers where each integer is between 1 and n (inclusive). You need to find a duplicate integer without modifying the array and using only O(1) extra space. The array can have multiple duplicates.",
            "options": [
                {"key": "A", "text": "Sort the array first and then scan sequentially. O(n log n) time, O(1) space."},
                {"key": "B", "text": "Use Floyd's Cycle Detection Algorithm (Tortoise and Hare) by treating the array as a linked list. O(n) time, O(1) space."},
                {"key": "C", "text": "Use a Hash Set to store visited numbers. O(n) time, O(n) space."},
                {"key": "D", "text": "Use Binary Search on the range [1, n]. O(n log n) time, O(1) space."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "Sorting is invalid because the array is read-only (modifying it is not allowed, or copy requires O(n) space).",
                "B": "Correct. Treating array values as pointers to indices creates a linked list with a cycle. Floyd's cycle detection locates the duplicate (start of cycle) in O(n) time and O(1) space.",
                "C": "Violates the O(1) extra space requirement, as the hash set grows linearly with unique items.",
                "D": "Works and fits constraints, but Floyd's algorithm runs in O(n) which is strictly better than O(n log n)."
            }
        },
        {
            "id": 2,
            "title": "Optimizing LRU Cache Eviction",
            "category": "Design & Data Structures",
            "scenario": "You need to design an LRU (Least Recently Used) cache with get(key) and put(key, value) operations. Both operations must run in O(1) average time complexity. Which combined data structure should you use?",
            "options": [
                {"key": "A", "text": "A singly linked list sorted by access order. O(1) insertions, O(n) searches."},
                {"key": "B", "text": "A binary search tree combined with an array. O(log n) average time."},
                {"key": "C", "text": "A Hash Map combined with a Doubly Linked List. Map stores keys pointing to list nodes, list tracks access order."},
                {"key": "D", "text": "A Min-Heap where the key is the timestamp of last access. O(log n) updates."}
            ],
            "correct_answer": "C",
            "explanations": {
                "A": "Singly linked list lookup is O(n), failing the O(1) constraint.",
                "B": "BST operations are O(log n), failing the O(1) constraint.",
                "C": "Correct. Hash map provides O(1) lookup. Doubly linked list allows O(1) updates to remove nodes and move them to the head in O(1) time.",
                "D": "Min-Heap eviction is O(1) (root), but updating/searching arbitrary keys is O(log n) or O(n) respectively."
            }
        },
        {
            "id": 3,
            "title": "Validating Parentheses Nesting",
            "category": "Stacks & Queues",
            "scenario": "You are parsing a code file and need to validate if brackets '(', ')', '{', '}', '[', and ']' are nested and closed correctly. Which data structure is most appropriate?",
            "options": [
                {"key": "A", "text": "A Queue (FIFO) - check incoming closing brackets against the front of the queue."},
                {"key": "B", "text": "A Stack (LIFO) - push opening brackets, pop and compare on closing brackets."},
                {"key": "C", "text": "A Hash Set - insert brackets and verify they are all paired at the end."},
                {"key": "D", "text": "A Doubly Ended Queue (Deque) - process elements from both sides towards the center."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "FIFO queue doesn't match bracket nesting. The last bracket opened must be the first one closed.",
                "B": "Correct. A stack correctly handles nesting because the most recently opened bracket is at the top of the stack and must match the next closing bracket.",
                "C": "Hash sets do not preserve order, which is critical to verifying nesting sequences.",
                "D": "Nesting validation requires relative ordering, which a deque alone doesn't solve without acting as a stack."
            }
        }
    ]
    
    # 2. ETL Quests
    etl_quests = [
        {
            "id": 1,
            "title": "Handling Late-Arriving Data in Streaming ETL",
            "category": "Streaming Pipelines",
            "scenario": "You have a streaming ETL pipeline (Apache Flink/Spark Streaming) processing user events. Events arrive late due to network latency. You need to calculate 5-minute event-time aggregation windows. How should you handle events that arrive after the window has closed?",
            "options": [
                {"key": "A", "text": "Discard late events immediately to avoid polluting calculations. Log them as errors."},
                {"key": "B", "text": "Use Watermarks with Allowed Lateness. Keep the window state in RocksDB for the allowed buffer time and emit updates when late events arrive."},
                {"key": "C", "text": "Switch to processing-time windows instead of event-time windows so late events are simply grouped by arrival time."},
                {"key": "D", "text": "Increase the window size to 2 hours so that all late events are naturally caught inside the same window."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "Discarding events leads to data loss and incorrect analytics, which is unacceptable for billing or critical business events.",
                "B": "Correct. Watermarking defines how long the engine waits for late events. Combined with 'Allowed Lateness', Flink/Spark keeps window state open, updating the aggregates incrementally as late events arrive.",
                "C": "Processing-time ignores when events actually happened, distorting hourly/daily analytics (e.g. events from midnight appear at 8 AM).",
                "D": "Increasing window size ruins real-time responsiveness (5-min SLA becomes 2-hour SLA)."
            }
        },
        {
            "id": 2,
            "title": "Avoiding Out-Of-Memory (OOM) in Large ETL Joins",
            "category": "Batch Processing",
            "scenario": "You are joining a huge transaction fact table (10 billion rows) with a small reseller dimension table (5,000 rows) in an Apache Spark ETL job. The job is failing with Executor OutOfMemory (OOM) errors. What optimization should you apply?",
            "options": [
                {"key": "A", "text": "Repartition both tables on the join key to redistribute the data across executors. O(n log n) shuffle."},
                {"key": "B", "text": "Increase the spark.executor.memory config setting to 128GB to handle the shuffle in-memory."},
                {"key": "C", "text": "Use a Broadcast Join (Map-Side Join). Broadcast the small reseller table to all executors, eliminating the need to shuffle the massive fact table."},
                {"key": "D", "text": "Convert the dimension table to a parquet format and cache it prior to joining."}
            ],
            "correct_answer": "C",
            "explanations": {
                "A": "Shuffling 10 billion rows is extremely expensive and causes heavy disk spill, leading to performance issues and potential OOMs.",
                "B": "Brute-force memory scaling is expensive and doesn't solve the underlying data skew or shuffle bottleneck.",
                "C": "Correct. Since the dimension table is tiny (5,000 rows, a few KB), broadcasting it avoids the network shuffle of the 10-billion-row fact table entirely. Each worker performs a local join.",
                "D": "Caching or file format changes do not prevent Spark from having to shuffle the fact table, which is the main source of the OOM."
            }
        },
        {
            "id": 3,
            "title": "Designing a Idempotent ETL Data Load",
            "category": "Data Warehousing",
            "scenario": "Your daily ETL pipeline loads data into a Snowflake data warehouse. If the pipeline runs twice due to a scheduler retry, you get duplicate records. How should you design the ingestion layer to guarantee idempotency?",
            "options": [
                {"key": "A", "text": "Execute a DELETE query for the date range before running the INSERT query (Delete-Insert pattern)."},
                {"key": "B", "text": "Use a staging table, merge it into the target table using a MERGE (UPSERT) statement based on a unique transaction ID, and clear staging."},
                {"key": "C", "text": "Rely on Snowflake's automatic primary key unique constraints to block duplicate inserts."},
                {"key": "D", "text": "Both A and B are acceptable idempotent patterns, depending on the overwrite requirements."}
            ],
            "correct_answer": "D",
            "explanations": {
                "A": "Delete-Insert is a classic batch idempotent pattern for partitions (e.g. daily overwrites).",
                "B": "Merge/Upsert is the standard pattern for upserting records by a unique key, ensuring retries update existing rows instead of inserting duplicates.",
                "C": "Snowflake does NOT enforce primary key uniqueness constraints during inserts; constraints are only metadata declarations.",
                "D": "Correct. Both patterns (Delete-Insert for time-series partitions, MERGE for upserts) are standard industry patterns to guarantee idempotency in warehouse loading."
            }
        }
    ]
    
    # 3. Spring Quests
    spring_quests = [
        {
            "id": 1,
            "title": "Solving Spring Circular Dependency",
            "category": "Core & DI",
            "scenario": "Class A autowires Class B, and Class B autowires Class A. During application startup, Spring fails to start with a BeanCurrentlyInCreationException. How should you resolve this circular dependency in a modern Spring Boot application?",
            "options": [
                {"key": "A", "text": "Use field injection instead of constructor injection. Spring will inject nulls temporarily and resolve them later."},
                {"key": "B", "text": "Refactor the code to break the cycle (e.g. introduce a third helper bean or event-driven interface). If refactoring isn't immediate, use @Lazy on one of the constructor parameters."},
                {"key": "C", "text": "Mark both beans with @Scope(\"prototype\") so that new instances are created indefinitely."},
                {"key": "D", "text": "Set spring.main.allow-circular-references=true in application.properties and forget about it."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "Field injection hides circular dependencies instead of resolving them, and Spring Boot 3+ disabled circular references by default.",
                "B": "Correct. Breaking the cycle is the best design choice. If not possible, @Lazy tells Spring to inject a proxy wrapper that initializes the actual bean on its first usage, breaking the startup deadlock.",
                "C": "Prototype scope with circular dependencies will lead to infinite recursion and an OutOfMemoryError / StackOverflowError.",
                "D": "While it forces the app to boot, it is a bad practice that suppresses architectural flaws and was deprecated as a default option."
            }
        },
        {
            "id": 2,
            "title": "Managing Transaction Rollback in Spring",
            "category": "Transactions & AOP",
            "scenario": "You have a method marked with @Transactional. Inside the method, a checked Exception (e.g. IOException) is thrown and caught inside the method block, but some database updates were already executed. What happens to the transaction, and how does Spring handle rollbacks by default?",
            "options": [
                {"key": "A", "text": "The transaction is rolled back immediately. Spring rolls back for all exceptions by default."},
                {"key": "B", "text": "The transaction commits anyway. By default, @Transactional only rolls back on unchecked exceptions (RuntimeException and Error)."},
                {"key": "C", "text": "The database locks the rows until the connection timeout occurs because checked exceptions freeze transaction completion."},
                {"key": "D", "text": "Spring rolls back checked exceptions if they are thrown, but commits if they are caught inside the method."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "Incorrect. Spring's default behavior is to roll back ONLY on RuntimeException (unchecked) and Error.",
                "B": "Correct. Checked exceptions (subclasses of java.lang.Exception but not RuntimeException) do not trigger rollback by default. To change this, use @Transactional(rollbackFor = Exception.class).",
                "C": "Exception throws don't hang connections; the transaction is completed (either committed or aborted) depending on Spring's rollback rules.",
                "D": "Even if thrown out of the method, a checked exception won't trigger rollback unless explicitly configured."
            }
        },
        {
            "id": 3,
            "title": "Spring Boot JPA N+1 Query Prevention",
            "category": "Spring Data JPA",
            "scenario": "You are using Spring Data JPA. A User entity has a @OneToMany relationship with Order. When you load 100 users and access their orders, Hibernate executes 101 SELECT queries (N+1 problem). How do you resolve this using Spring Data JPA repository methods?",
            "options": [
                {"key": "A", "text": "Annotate the relationship with @OneToMany(fetch = FetchType.LAZY) so orders are loaded lazily."},
                {"key": "B", "text": "Use @Query(\"SELECT u FROM User u JOIN FETCH u.orders\") in your repository method to perform an eager fetch join in a single query."},
                {"key": "C", "text": "Wrap the repository call inside a @Transactional block, which merges queries automatically."},
                {"key": "D", "text": "Increase Hibernate's connection pool size so queries are executed in parallel."}
            ],
            "correct_answer": "B",
            "explanations": {
                "A": "FetchType.LAZY is the default for @OneToMany, and it is the direct cause of the N+1 queries when orders are subsequently accessed in a loop.",
                "B": "Correct. JOIN FETCH tells JPA/Hibernate to generate a single SQL join query and eagerly fetch the orders collection for all users in one go, preventing N+1 queries.",
                "C": "Transactions preserve cache and connection scope but do not automatically merge lazy-load calls into join queries.",
                "D": "Hibernate does not execute lazy query lookups in parallel. Running 100 serial queries will always be a major performance bottleneck."
            }
        }
    ]
    
    # Write mock quests
    for name, data in [("dsa", dsa_quests), ("etl", etl_quests), ("spring", spring_quests)]:
        out_path = f"e:\\Study\\SystemDesign\\{name}_quests.json"
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Generated {len(data)} mock quests in {out_path}")

if __name__ == "__main__":
    parse_pdf()
    generate_mock_quests()
