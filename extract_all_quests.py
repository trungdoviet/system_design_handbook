import fitz
import re
import json
import os
import sys

# Configure stdout to print UTF-8
sys.stdout.reconfigure(encoding='utf-8')

def categorize_day(day_num, title, scenario):
    text = (title + " " + scenario).lower()
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

def parse_explanation_blocks(ans_text):
    delim_regex = r'(Answer\s+\d+|Option\s+[A-D]|\bWhy\s+[A-D]\b)'
    parts = re.split(delim_regex, ans_text, flags=re.IGNORECASE)
    
    blocks = []
    i = 1
    while i < len(parts):
        delim = parts[i]
        text = parts[i+1] if i + 1 < len(parts) else ""
        blocks.append((delim, text))
        i += 2
        
    explanations = {}
    correct_answer = None
    
    for delim, text in blocks:
        full_content = delim + " " + text
        match = re.search(r'\bWhy\s+([A-D])\b|Answer\s*[:—\-]?\s*([A-D])\b|Option\s*([A-D])\b|^\s*([A-D])\b', full_content, re.IGNORECASE | re.MULTILINE)
        letter = None
        if match:
            letter = (match.group(1) or match.group(2) or match.group(3) or match.group(4)).upper()
            
        if letter:
            if "CORRECT ANSWER" in full_content.upper() or "✅" in full_content or "WINS" in full_content.upper() or "CORRECT" in full_content.upper():
                correct_answer = letter
                
            cleaned_block = []
            for l in text.split('\n'):
                l_s = l.strip()
                if not l_s:
                    continue
                if "ANSWERS & EXPLANATIONS" in l_s or "DAY " in l_s or re.match(r'^\d+$', l_s):
                    continue
                cleaned_block.append(l_s)
                
            explanations[letter] = "\n".join(cleaned_block).strip()
            
    if not correct_answer:
        for letter, exp in explanations.items():
            if "CORRECT" in exp.upper() or "✓" in exp or "wins" in exp.lower():
                correct_answer = letter
                break
                
    return explanations, correct_answer

def extract_quests():
    pdf_path = r"e:\Study\SystemDesign\resource\system-design-questions-ebook.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        return

    print("Opening PDF and scanning pages...")
    doc = fitz.open(pdf_path)
    
    sd_pages = {}
    ans_pages = {}
    
    # Locate page indexes for each day
    for i in range(len(doc)):
        text = doc[i].get_text()
        sd_match = re.search(r'^\s*DAY\s+(\d+)\s*·\s*SYSTEM\s+DESIGN', text, re.IGNORECASE | re.MULTILINE)
        if sd_match:
            sd_pages[int(sd_match.group(1))] = i
        ans_match = re.search(r'^\s*DAY\s+(\d+)\s*·\s*ANSWERS\s+&\s+EXPLANATIONS', text, re.IGNORECASE | re.MULTILINE)
        if ans_match:
            ans_pages[int(ans_match.group(1))] = i
            
    print(f"Scanned {len(sd_pages)} Quest start pages and {len(ans_pages)} Answer start pages.")
    
    quests = []
    
    # Process each day
    for day in sorted(sd_pages.keys()):
        quest_start = sd_pages[day]
        quest_end = ans_pages.get(day, len(doc))
        
        # 1. Extract Quest Page Content
        quest_text = ""
        for p in range(quest_start, quest_end):
            quest_text += doc[p].get_text() + "\n"
            
        lines = [l.strip() for l in quest_text.split('\n') if l.strip()]
        
        # Clean lines from PDF footers/headers
        cleaned_lines = []
        for l in lines:
            if "SYSTEM DESIGN" in l or "DAY " in l or re.match(r'^\d+$', l):
                continue
            cleaned_lines.append(l)
            
        if len(cleaned_lines) < 2:
            print(f"Warning: Day {day} quest has insufficient lines. Skipping.")
            continue
            
        title = cleaned_lines[0]
        
        # Find option indices using a robust backward scan
        opt_a_idx = opt_b_idx = opt_c_idx = opt_d_idx = None
        
        for idx in range(len(cleaned_lines) - 1, -1, -1):
            l = cleaned_lines[idx]
            if opt_d_idx is None:
                if l == 'D' or re.match(r'^D\s*[\)·\-\—\.\)]', l):
                    opt_d_idx = idx
            elif opt_c_idx is None:
                if l == 'C' or re.match(r'^C\s*[\)·\-\—\.\)]', l):
                    opt_c_idx = idx
            elif opt_b_idx is None:
                if l == 'B' or re.match(r'^B\s*[\)·\-\—\.\)]', l):
                    opt_b_idx = idx
            elif opt_a_idx is None:
                if l == 'A' or re.match(r'^A\s*[\)·\-\—\.\)]', l):
                    opt_a_idx = idx
                    
        if None in (opt_a_idx, opt_b_idx, opt_c_idx, opt_d_idx):
            print(f"Warning: Day {day} could not find option boundaries. Skipping.")
            continue
            
        scenario = "\n".join(cleaned_lines[1:opt_a_idx]).strip()
        
        # Get Option Texts based on inline vs split line structure
        if re.match(r'^A\s*[\)·\-\—\.\)]', cleaned_lines[opt_a_idx]):
            opt_a = " ".join(cleaned_lines[opt_a_idx:opt_b_idx])
            opt_a = re.sub(r'^A\s*[\)·\-\—\.\)]\s*', '', opt_a).strip()
        else:
            opt_a = " ".join(cleaned_lines[opt_a_idx+1:opt_b_idx]).strip()

        if re.match(r'^B\s*[\)·\-\—\.\)]', cleaned_lines[opt_b_idx]):
            opt_b = " ".join(cleaned_lines[opt_b_idx:opt_c_idx])
            opt_b = re.sub(r'^B\s*[\)·\-\—\.\)]\s*', '', opt_b).strip()
        else:
            opt_b = " ".join(cleaned_lines[opt_b_idx+1:opt_c_idx]).strip()

        if re.match(r'^C\s*[\)·\-\—\.\)]', cleaned_lines[opt_c_idx]):
            opt_c = " ".join(cleaned_lines[opt_c_idx:opt_d_idx])
            opt_c = re.sub(r'^C\s*[\)·\-\—\.\)]\s*', '', opt_c).strip()
        else:
            opt_c = " ".join(cleaned_lines[opt_c_idx+1:opt_d_idx]).strip()

        if re.match(r'^D\s*[\)·\-\—\.\)]', cleaned_lines[opt_d_idx]):
            opt_d = " ".join(cleaned_lines[opt_d_idx:])
            opt_d = re.sub(r'^D\s*[\)·\-\—\.\)]\s*', '', opt_d).strip()
        else:
            opt_d = " ".join(cleaned_lines[opt_d_idx+1:]).strip()
        
        # 2. Extract Answers Content
        ans_start = ans_pages[day]
        ans_end = sd_pages.get(day + 1, len(doc))
        
        ans_text = ""
        for p in range(ans_start, ans_end):
            ans_text += doc[p].get_text() + "\n"
            
        explanations, correct_answer = parse_explanation_blocks(ans_text)
        
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
            "correct_answer": correct_answer or "A",
            "explanations": explanations
        })
        print(f"Parsed Day {day:02d}: {title} (Correct: {correct_answer})")
        
    output_path = r"e:\Study\SystemDesign\system_design_quests.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(quests, f, indent=2, ensure_ascii=False)
    print(f"\nCompleted! Seeded {len(quests)} detailed System Design quests into {output_path}")

if __name__ == "__main__":
    extract_quests()
