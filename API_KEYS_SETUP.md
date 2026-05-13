# API Keys Setup — Quick Reference

## Palm Reader Tool — Required API Key

### 1. Get Google API Key

1. Go to: https://aistudio.google.com/apikey
2. Click **"Create API Key"**
3. Choose project (new or existing)
4. Copy the generated key

### 2. Local Development Setup

**For Windows:**
```bash
# Create .env.local file
echo GEMINI_API_KEY=AIzaSy[YOUR-KEY] > .env.local
```

**For Mac/Linux:**
```bash
echo "GEMINI_API_KEY=AIzaSy[YOUR-KEY]" > .env.local
```

**Manual (all platforms):**
1. Create file: `.env.local` in project root
2. Add: `GEMINI_API_KEY=AIzaSy[YOUR-KEY]`
3. Save and restart `npm run dev`

### 3. Production Setup (Vercel)

1. Go to: https://vercel.com/agss3199/topaitoolrank-website
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key
   - **Environments**: Production
4. Click **Save**
5. Redeploy: `vercel deploy --prod`

## Verify Setup

```bash
# Check local setup (should show your key)
cat .env.local

# Test in Vercel
curl https://topaitoolrank.com/tools/palm-reader

# Check API quota
# Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

## Optional Configuration

```bash
# Specify Gemini model (defaults to gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash

# Options:
# - gemini-2.0-flash (fastest, recommended)
# - gemini-1.5-pro (slower, higher quality)
# - gemini-1.5-flash (lighter weight)
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "GEMINI_API_KEY is not configured" | Add `GEMINI_API_KEY` to `.env.local` or Vercel env vars |
| "Too many requests" | Check [quota limits](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas) |
| "Service temporarily unavailable" | API key may be invalid or quotas exceeded |
| Camera permission denied | Grant camera permission when prompted |

## Security Notes

✅ DO:
- Store keys in `.env.local` (git-ignored)
- Use Vercel Environment Variables for production
- Rotate keys periodically
- Use project-specific API keys

❌ DON'T:
- Commit `.env.local` to git
- Hardcode keys in source files
- Share API keys in messages/tickets
- Use admin/service account keys

## Support

- [Google AI Studio](https://aistudio.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- Check logs: `vercel logs topaitoolrank-website`
