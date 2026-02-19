import os
import json
from bs4 import BeautifulSoup
import re

def clean_text(text):
    """
    Cleans up text by removing extra whitespace and handling some common MathJax artifacts.
    """
    if not text:
        return ""
    # Remove zero-width spaces and other invisible characters if any
    text = text.replace('\u200b', '').replace('\xa0', ' ')
    # Collapse multiple spaces into one
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_subject_name(subject_text):
    """
    Cleans subject name, e.g., "Physics (25)" -> "Physics".
    """
    # Remove (numbers) at the end
    subject_text = re.sub(r'\s*\(\d+\)$', '', subject_text)
    return subject_text.strip()

def extract_questions_from_html(html_file_path, default_subject="General Subject", topic="Exam"):
    print(f"Processing: {html_file_path}")
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    questions = []
    
    # Iterate through elements in order to track subject changes
    # We look for H2 headers (Subjects) and Question Blocks
    elements = soup.find_all(lambda tag: tag.name == 'h2' or (tag.name == 'div' and 'questionBlock' in tag.get('class', [])))

    current_subject = default_subject
    question_count = 0

    print(f"  Found {len(elements)} relevant elements (Headers + Questions).")

    for element in elements:
        if element.name == 'h2':
            # Potential Subject Header
            header_text = clean_text(element.get_text(strip=True))
            # Filter out non-subject headers if possible (or just use them and let user clean up)
            # Common patterns: "Physics (25)", "Chemistry (25)"
            # Ignore "Analysis Report" or "Varsity..." if they appear before questions
            if "Analysis Report" not in header_text and "Program" not in header_text:
                 current_subject = clean_subject_name(header_text)
                 print(f"  -> Switch Subject to: {current_subject}")
        
        elif element.name == 'div':
            # Question Block
            block = element
            question_count += 1
            
            question_data = {
                "id": question_count,
                "subject": current_subject,
                "topic": topic,
                "question": "",
                "hasDiagram": False,
                "svg_code": "",
                "options": {},
                "correctAnswer": "",
                "explanation": ""
            }
            
            # 1. Extract Question Text
            question_text_div = block.find('div', class_='questionText')
            if question_text_div:
                # Get text, separating obscure tags with space
                raw_text = question_text_div.get_text(separator=' ', strip=True)
                question_data['question'] = clean_text(raw_text)
            else:
                question_data['question'] = "Question text not found"

            # 2. Extract Options
            option_divs = block.find_all('div', class_='questionOption')
            
            # Mapping for option labels to lowercase keys a, b, c, d
            label_map = {'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd', 'E': 'e'}
            
            for opt_div in option_divs:
                # Label (A, B, C, D)
                label_span = opt_div.find('span', class_='input-group-text')
                raw_label = ""
                if label_span:
                    raw_label = clean_text(label_span.get_text(strip=True))
                
                # Convert A -> a, B -> b, etc.
                key = label_map.get(raw_label.upper(), raw_label.lower())
                
                # Text
                text_label = opt_div.find('label')
                opt_text = ""
                if text_label:
                    opt_text = clean_text(text_label.get_text(separator=' ', strip=True))
                
                # Add to options dictionary
                if key:
                    question_data['options'][key] = opt_text
                
                # Correct Answer Check
                if opt_div.find('span', class_='fa-check'):
                    question_data['correctAnswer'] = key

            # 3. Extract Solution
            solve_text_div = block.find('div', class_='solveText')
            if solve_text_div:
                raw_solution = solve_text_div.get_text(separator=' ', strip=True)
                # Remove the "Solution:" prefix if it exists
                raw_solution = re.sub(r'^Solution:\s*', '', raw_solution, flags=re.IGNORECASE)
                question_data['explanation'] = clean_text(raw_solution)

            questions.append(question_data)

    print(f"  Extracted {len(questions)} questions.")
    return questions

def main():
    # Find all HTML files in the current directory
    html_files = [f for f in os.listdir('.') if f.lower().endswith('.html')]

    if not html_files:
        print("No HTML files found in the current directory.")
        print("Please place the HTML file in this folder and run the script again.")
        return

    for html_file in html_files:
        # Use filename as subject/topic hint or valid default?
        base_name = os.path.splitext(html_file)[0]
        
        questions = extract_questions_from_html(html_file, default_subject=base_name, topic="Exam")
        
        # JSON Output
        json_filename = f"{base_name}.json" 
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=4)
        print(f"  Saved Workable JSON data to: {json_filename}")

    print("\nExtraction complete!")

if __name__ == "__main__":
    main()
