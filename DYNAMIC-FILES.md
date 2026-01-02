# ✅ Dynamic Question File Detection

## What Changed

এখন আর `question-files.json` manually update করতে হবে না! 

**GitHub API** use করে **automatically** public folder থেকে সব question JSON file detect করবে।

## How It Works

### Automatic Detection Logic

যে file গুলো দেখাবে:
- ✅ `questions.json`
- ✅ `questions-*.json` (questions-4.json, questions-5j.json, ইত্যাদি)
- ✅ `chemistry*.json` (Chemistry2.json, Chemistry3.json, ইত্যাদি)

যে file গুলো skip করবে:
- ❌ `manifest.json`
- ❌ `question-files.json`
- ❌ অন্য কোন non-question JSON files

### Display Name Format

| File Name | Display Name |
|-----------|--------------|
| `questions.json` | Default Question Set |
| `questions-4.json` | Question Set 4 |
| `questions-Answer.json` | Answer Question Set |
| `Chemistry2.json` | Chemistry 2 |
| `Chemistry3.json` | Chemistry 3 |

## What to Do Now

1. **Commit and Push**:
   ```bash
   git push origin main
   ```

2. **Wait for Vercel Deploy** (1-2 minutes)

3. **Test**:
   - Open admin panel
   - Click settings icon (⚙️)
   - **সব question files দেখাবে automatically!**

## Adding New Question Files

### এখন খুব সহজ!

1. নতুন JSON file যোগ করুন `/public` folder এ
2. File name দিন এই format এ:
   - `questions-X.json` (X = number)
   - `Chemistry X.json`
   - বা যেকোনো নাম যা `questions` বা `chemistry` দিয়ে শুরু হয়
3. Git commit এবং push করুন
4. **Automatically settings modal এ দেখাবে!**

## Example New Files

```
public/
├── questions.json            ✅ "Default Question Set"
├── questions-4j.json         ✅ "Question Set 4"  
├── questions-5j.json         ✅ "Question Set 5"
├── questions-6j.json         ✅ "Question Set 6"
├── Chemistry2.json           ✅ "Chemistry 2"
├── Chemistry3.json           ✅ "Chemistry 3"
├── questions-Physics.json    ✅ "Physics Question Set"
└── manifest.json             ❌ Skipped
```

## No More Manual Updates!

আর কোন manual update লাগবে না `question-files.json` এ!

যতগুলো file যোগ করবেন, সব automatically detect হবে। 🎉
