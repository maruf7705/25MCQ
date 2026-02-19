# Udvas Question Extractor

 This folder contains a tool to extract questions, options, and solutions from Udvas exam HTML files.

 ## How to Use

 1.  **Place your HTML file(s)** inside this folder (`Extract_Udvas`).
 2.  **Run the script**:
     Double-click `extract_questions.py` (if Python is set up to run) or open a terminal in this folder and type:
     ```bash
     python extract_questions.py
     ```
 3.  **Check the output**:
     - The script will generate two files for each HTML file:
         - `[filename]_extracted.txt`: A readable text file with questions and answers.
         - `[filename]_extracted.json`: A data file for use in other programs.

 ## Requirements

 - Python installed.
 - `beautifulsoup4` library installed.
   If you haven't installed it yet, run:
   ```bash
   pip install beautifulsoup4
   ```
