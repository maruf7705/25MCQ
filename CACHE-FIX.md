# Quick Fix: Question Set Not Changing

## Problem
You changed the question set in admin panel and pushed to GitHub, but the exam still shows old questions.

## Root Cause
GitHub's CDN caches the `exam-config.json` file for 5 minutes, so the exam page was loading the old cached version.

## Solution Applied
✅ Added cache-busting timestamps to all API calls
✅ URL now includes `?t=timestamp` to bypass cache
✅ Added cache-control headers

## What You Need to Do Now

### 1. Push the Fix to GitHub
```bash
git push origin main
```

### 2. Wait for Vercel to Redeploy
- Vercel will automatically deploy the new code
- Wait 1-2 minutes for deployment to complete

### 3. Test Again
1. Open admin panel
2. Click settings icon (⚙️)
3. Select a different question set
4. Click save
5. Go to exam page
6. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
7. Questions should now be from the selected file

## How to Verify Which Question File is Active

**Check in Browser Console**:
1. Open exam page
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for: `Loading questions from /questions-X.json`
5. This shows which file is being loaded

## If Still Not Working

### Check exam-config.json in GitHub
1. Go to: https://github.com/maruf7705/25MCQ/blob/main/exam-config.json
2. Check if `activeQuestionFile` matches what you selected
3. If not, the GitHub token might not be working

### Check GitHub Token
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `GITHUB_TOKEN` is set
3. If missing, add it (see VERCEL-DEPLOYMENT.md)

### Hard Refresh
Sometimes your browser caches the JavaScript files:
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## Technical Details

The cache-busting works by adding a unique timestamp to every config request:
```
Before: /exam-config.json
After:  /exam-config.json?t=1735806803000
```

This forces both GitHub CDN and the browser to fetch a fresh copy instead of using the cached version.
