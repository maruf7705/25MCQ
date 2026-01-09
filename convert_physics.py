import re
import json
import os

source_file = r'c:\Users\mdmar\Documents\GitHub\25MCQ\public\Physics-All.json'
output_dir = r'c:\Users\mdmar\Documents\GitHub\25MCQ\public'

def parse_js_objects(content):
    # This regex attempts to find array blocks like [ ... ]
    # It's a bit naive but should work for the provided file structure where arrays are distinct
    # aggregating all content into one string first
    
    # Remove comments
    content = re.sub(r'//.*', '', content)
    
    # Extract the array assignments or just arrays
    # Looking for patterns like [ { ... }, { ... } ]
    
    # Let's try to extract all objects {...} and group them by 25
    # Since the file structure is essentially [ ... ], [ ... ], ...
    # We can just find all occurrences of objects.
    
    # Regex to capture individual object properties
    # Valid keys seen: q, opts, options, a, ans, exp
    # Values can be strings "...", numbers, or arrays [...]
    
    objects = []
    
    # Split by formatted "}, {" or similar boundaries might be risky if strings contain them.
    # Instead, let's try a custom state machine or just use a library if possible? 
    # Standard json lib won't work.
    # Let's use regex to find all { ... } blocks. 
    # Given the file formatting is remarkably consistent (one object per line mostly), we can iterate lines.
    
    current_object = {}
    current_set = []
    all_sets = []
    
    # Normalized keys map
    key_map = {
        'q': 'question',
        'ref': 'reference', # if exists
        'opts': 'options',
        'options': 'options',
        # 'a' and 'ans' need handling to convert index/value to 'a','b','c','d'
        'a': 'correctAnswer', 
        'ans': 'correctAnswer',
        'exp': 'explanation'
    }

    raw_text = content.replace('\n', ' ')
    
    # Dirty regex to extract objects: { q: "...", ... }
    # We look for { followed by non-brace characters (recursively? no, just simplistic)
    # The file has nested braces only for options array.
    
    # Strategy: Find all substrings starting with { and ending with } that look like a question object
    # Pattern: \s*\{\s*q\s*:\s*
    
    object_pattern = re.compile(r'\{\s*(?:q|question)\s*:.*?\}(?=\s*,|\s*\])', re.DOTALL)
    
    # Since regex is hard for nested structures, let's try to parse it as "dirty JSON"
    # We will wrap it in a list [ ... ] and try to fix quotes using regex.
    
    # 1. Quote keys
    # q: -> "q":, opts: -> "opts":, a: -> "a":, exp: -> "exp":
    # options: -> "options":, ans: -> "ans":
    
    content = re.sub(r'\b(q|opts|options|a|ans|exp)\s*:', r'"\1":', content)
    
    # 2. Convert single quotes to double quotes if any (looks like mostly double quotes in file)
    
    # 3. Trailing commas? Python's json usually strict.
    
    # Let's process the file chunks manually.
    
    with open(source_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sets = []
    current_batch = []
    
    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith('//'): continue
        if line.startswith('[') and len(line) < 5: # New set start
            if current_batch:
                sets.append(current_batch)
                current_batch = []
            continue
        if line.startswith(']'): # Set end
            if current_batch:
                sets.append(current_batch)
                current_batch = []
            continue
            
        # Parse individual line object
        # Example: { q: "...", opts: [...], a: 0, exp: "..." },
        
        # Simple parser for the specific consistent format
        # Extract q proper
        q_match = re.search(r'(?:q|question)\s*:\s*"(.*?)"', line)
        if not q_match: continue
        q_text = q_match.group(1)
        
        # Extract options
        # opts: ["...", "...", "...", "..."],
        opts_match = re.search(r'(?:opts|options)\s*:\s*\[(.*?)\]', line)
        if not opts_match: continue
        opts_raw = opts_match.group(1)
        # Split options by comma, but careful about commas inside quotes
        # Simple CSV-like split for "...", "..."
        opts_list = [o.strip().strip('"').strip("'") for o in re.split(r',(?=(?:[^"]*"[^"]*")*[^"]*$)', opts_raw)]
        
        # Extract answer
        # a: 0 or ans: 1
        a_match = re.search(r'(?:a|ans)\s*:\s*(\d+)', line)
        a_index = int(a_match.group(1)) if a_match else 0
        
        # Extract explanation
        # exp: "..." or missing
        exp_match = re.search(r'exp\s*:\s*"(.*?)"', line)
        exp_text = exp_match.group(1) if exp_match else ""
        
        # Construct standardized object
        std_obj = {
            "id": len(current_batch) + 1,
            "subject": "Physics",
            "topic": "General Physics",
            "question": q_text,
            "hasDiagram": False,
            "svg_code": "",
            "options": {
                "a": opts_list[0] if len(opts_list) > 0 else "",
                "b": opts_list[1] if len(opts_list) > 1 else "",
                "c": opts_list[2] if len(opts_list) > 2 else "",
                "d": opts_list[3] if len(opts_list) > 3 else ""
            },
            "correctAnswer": ['a', 'b', 'c', 'd'][a_index] if 0 <= a_index < 4 else 'a',
            "explanation": exp_text
        }
        
        current_batch.append(std_obj)
        
    if current_batch:
        sets.append(current_batch)
        
    return sets

def write_json_files(sets):
    for i, data_set in enumerate(sets):
        filename = f"Physics-P{i+1}.json"
        filepath = os.path.join(output_dir, filename)
        
        # Re-number IDs just in case
        for idx, item in enumerate(data_set):
            item['id'] = idx + 1
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data_set, f, ensure_ascii=False, indent=2)
        print(f"Generated {filename} with {len(data_set)} questions.")

if __name__ == "__main__":
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    sets = parse_js_objects(content)
    write_json_files(sets)
