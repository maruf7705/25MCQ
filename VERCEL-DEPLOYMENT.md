# Vercel Deployment Summary

## Manual Question Set Selector - Vercel Implementation

### What Changed for Vercel

The manual question set selector has been adapted to work on Vercel's serverless environment, which has different constraints than a traditional Node.js server.

### Key Changes

1. **Question Files Manifest** (`public/question-files.json`)
   - Created a static JSON file listing all available question sets
   - Vercel can't scan the filesystem, so we maintain this list manually
   - **Action Required**: Update this file whenever you add new question JSON files

2. **API Endpoints Updated**
   - All endpoints now use `fetch()` instead of filesystem operations
   - Works seamlessly on both local development and Vercel

3. **GitHub Integration for Config Persistence**
   - On Vercel, config changes are saved to GitHub repository
   - **Action Required**: Set `GITHUB_TOKEN` in Vercel environment variables

### Setup Instructions for Vercel

#### 1. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "25MCQ Vercel Config"
4. Select scopes: `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again)

#### 2. Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your GitHub token from step 1
   - **Environment**: Production, Preview, Development (select all)
4. Click "Save"

#### 3. Redeploy

After adding the environment variable, trigger a new deployment for changes to take effect.

### How It Works on Vercel

**Question File Selection**:
1. Admin clicks settings icon (⚙️)
2. Modal fetches `/question-files.json` to list available files
3. Admin selects a question set
4. On save, API validates the file exists
5. API updates `exam-config.json` in GitHub repo via GitHub API
6. Students' exam page reads config from GitHub raw content

**File Storage**:
- Question JSON files: Served statically from `/public`
- Configuration: Stored in GitHub repo (`exam-config.json`)
- Manifest: Static file (`public/question-files.json`)

### Maintaining Question Files

When you add a new question JSON file:

1. **Add the file** to `/public` directory
2. **Update** `public/question-files.json`:
   ```json
   {
     "questionFiles": [
       {
         "name": "questions.json",
         "displayName": "Default Question Set"
       },
       {
         "name": "questions-5.json",
         "displayName": "Question Set 5"
       }
     ]
   }
   ```
3. **Commit and push** to GitHub
4. Vercel will automatically deploy

### Testing

1. **Local**: Run `npm run dev` - works with filesystem
2. **Vercel**: After deployment, test:
   - Open admin panel
   - Click settings icon
   - Verify question files are listed
   - Select a file and save
   - Check GitHub repo to confirm `exam-config.json` updated

### Troubleshooting

**Error: "GitHub token not configured"**
- Add `GITHUB_TOKEN` environment variable in Vercel

**Error: "Failed to load question files: 500"**
- Check if `public/question-files.json` exists
- Verify JSON format is correct

**Config not updating**
- Check GitHub token has `repo` permissions
- Verify repository name is correct in API code

**Old config persisting**
- GitHub CDN may cache files
- Wait 1-2 minutes or add `?v=timestamp` to bypass cache
