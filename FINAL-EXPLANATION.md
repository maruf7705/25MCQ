# 🚀 Project Documentation & System Explanation

This document consolidates all recent updates, fixes, and operating procedures for the 25MCQ project. It supersedes previous instructions regarding manual file updates.

## 🌟 Key Features (Current State)

### 1. Automatic Question File Detection
You **DO NOT** need to manually update `question-files.json` anymore.
- **How it works**: The system uses the GitHub API to scan the `/public` folder for question files.
- **Supported File Names**:
  - `questions-*.json` (e.g., `questions-4.json`)
  - `Chemistry*.json` (e.g., `Chemistry2.json`)
  - Any valid JSON file is now technically allowed due to relaxed validation.

### 2. Smart Caching & Updates
- **Problem Solved**: Previously, changing question sets in the admin panel wouldn't reflect immediately due to caching.
- **Solution**: We now use "cache-busting" (adding `?t=timestamp` to URLs).
- **Result**: Changes to the active question set are applied immediately after a refresh.

---

## 🛠️ How to Add New Question Sets

1. **Create the File**: Add your new JSON file to the `public/` folder.
   - Example: `public/Physics1.json`
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Physics questions"
   git push origin main
   ```
3. **Wait & Verify**:
   - Wait 1-2 minutes for Vercel to redeploy.
   - Go to your Admin Panel settings.
   - The new file will appear **automatically**. Select it and save.

---

## ⚙️ Vercel & GitHub Configuration

For the automatic detection and strict configuration to work, Vercel needs access to your GitHub repository.

### Environment Variables
Ensure the following variable is set in your Vercel Project Settings:
- **`GITHUB_TOKEN`**: A Personal Access Token (Classic) with `repo` scope.
  - *Why?* This allows the app to read the file list and update `exam-config.json` directly on GitHub.

---

## 🔧 Troubleshooting Common Issues

### ❌ Error: "Failed to load question files: 404"
- **Cause**: The file exists locally but hasn't been pushed to GitHub.
- **Fix**: Run `git push origin main`.

### ❌ Error: "Invalid question file format"
- **Cause**: Validation logic was too strict (fixed in recent updates) or the file is not valid JSON.
- **Fix**: Ensure your file ends in `.json` and contains valid JSON syntax (use a validator if unsure).

### ❌ Changes Not Showing?
- **Fix**: Hard refresh your browser.
  - Windows: `Ctrl + F5`
  - Mac: `Cmd + Shift + R`

---

## 📂 File Structure Overview

- **`public/`**: Stores your question JSON files (`questions.json`, `Chemistry1.json`, etc.).
- **`exam-config.json`**: Stores the name of the *currently active* question file.
- **`api/`**: Serverless functions that handle listing files and updating the config.

---

*This document is a summary of `DYNAMIC-FILES.md`, `CACHE-FIX.md`, `FIX-404.md`, `VALIDATION-FIX.md`, and `VERCEL-DEPLOYMENT.md`.*
