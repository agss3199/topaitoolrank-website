# Palm Reader Tool — Setup & Configuration Guide

## Environment Variables Required

The Palm Reader tool requires the following environment variables to function:

### 1. GEMINI_API_KEY (Required)

**Purpose**: Google Generative AI API key for Gemini Vision analysis  
**Type**: String  
**Format**: `AIzaSy...` (starts with "AIzaSy")  
**Where to obtain**: [Google AI Studio](https://aistudio.google.com/apikey)

### 2. GEMINI_MODEL (Optional)

**Purpose**: Specify which Gemini model to use for palm reading analysis  
**Type**: String  
**Default**: `gemini-2.0-flash`  
**Allowed values**:
- `gemini-2.0-flash` (default, recommended - fastest)
- `gemini-2.0-flash-exp` (experimental version)
- `gemini-1.5-pro` (slower, higher quality)
- `gemini-1.5-flash` (lightweight, good for dev)

## Setting Environment Variables

### Local Development

1. Create a `.env.local` file in the project root:
```bash
touch .env.local
```

2. Add your API keys:
```env
# .env.local
GEMINI_API_KEY=AIzaSy[your-key-here]
GEMINI_MODEL=gemini-2.0-flash
```

3. The `.env.local` file is automatically loaded by Next.js in development

### Vercel Deployment

1. Go to your Vercel project: https://vercel.com/agss3199/topaitoolrank-website

2. Navigate to **Settings → Environment Variables**

3. Add the following:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google API key
   - **Environments**: Production (and Preview/Development if desired)

4. Click **Save**

5. Redeploy the application for changes to take effect:
```bash
vercel deploy --prod
```

## How to Get Google API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Select **"Create API key in new Google Cloud project"** (or existing project)
4. Copy the generated API key
5. Store securely in environment variables (NEVER commit to git)

## Auto-Capture Logic

The tool has been configured with conservative thresholds to ensure high-quality palm images:

| Threshold | Value | Purpose |
|-----------|-------|---------|
| Confidence | 85% | Ensures hand detection is confident |
| Stability | 60 frames | 2 seconds at 30fps — hand must remain still |
| Delta | < 4px | Cumulative movement threshold across all landmarks |
| Centering | [0.25, 0.75] | Palm must be centered in frame |

### Capture Conditions (All must be met)

1. **Hand Detected**: Camera detects a hand via MediaPipe
2. **Centered**: Palm center (landmark 9) is within [0.25, 0.75] on both axes
3. **High Quality**: Confidence ≥ 85% (quality ≥ 85%)
4. **Stable**: Hand movement < 4px for 60 consecutive frames (~2 seconds)
5. **No Prior Capture**: Only captures once per session

### Status Messages During Capture

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| Loading... | Initializing camera | Wait for camera to load |
| Point palm at camera | No hand detected | Show palm to camera |
| Move palm to center | Hand detected but not centered | Position palm in frame center |
| Better lighting needed | Hand visible but confidence < 85% | Improve lighting or adjust distance |
| Hold steady... | Waiting for stability | Keep hand still for ~2 seconds |
| ✅ Ready! Capturing... | All conditions met | Continue holding - image captured |

## Testing the Tool

### Local Testing

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Navigate to http://localhost:3000/tools/palm-reader
```

### Requirements for Testing

- Camera/webcam access enabled
- Good lighting (well-lit room)
- Palm clearly visible (not too close, not too far)
- Hold hand steady for ~2 seconds

### Troubleshooting

**"Temporarily unavailable" error**
- Check: `GEMINI_API_KEY` environment variable is set
- Check: API key is valid and not expired
- Check: Google Cloud project has "Generative Language API" enabled

**"Service temporarily unavailable" (500 error)**
- Check: GEMINI_API_KEY is configured in Vercel
- Check: API quotas not exceeded (visit [Google Cloud Console](https://console.cloud.google.com))
- Check: Network connectivity

**"Analyze palm image failed"**
- Check: Hand/palm is clearly visible
- Check: Image is in JPEG/PNG/WebP format
- Check: Image size < 10MB

**Camera permission denied**
- Grant camera permission when prompted by browser
- Check browser console for specific permission error

**Camera doesn't start**
- Chrome/Edge: Try different camera if multiple available
- Check: `https://` connection (required for camera access)
- Check: Browser camera permissions in settings

## Performance Notes

### Image Size

- Maximum: 10 MB
- Typical: 200-400 KB (from 640x480 canvas)
- Vercel limit: ~6 MB per request (warning at 4 MB)

### Latency

- Camera initialization: 1-2 seconds
- Hand detection: Real-time (~30fps)
- Stability wait: ~2 seconds (60 frames)
- Gemini API call: 2-5 seconds
- Total: ~5-10 seconds per palm reading

### Rate Limiting

- Limit: 5 requests per IP per 60 seconds
- Error: 429 Too Many Requests
- Purpose: Prevent abuse and API quota exhaustion

## Security Considerations

✅ **Secure**
- API key stored in environment variables (never in code)
- Requests from server-side only (no NEXT_PUBLIC_ prefix)
- HTTPS enforced (Vercel default)
- Rate limiting enabled
- Payload size validation (max 10 MB)
- MIME type validation (jpeg/png/webp only)

❌ **Not Recommended**
- Hardcoding API keys in code
- Sharing API keys in public repositories
- Using personal API keys for production
- Exposing API keys in error messages

## Limits & Quotas

### API Quotas (Free Tier)

- **Requests per day**: 1,500
- **Requests per minute**: 60
- **Characters per minute**: 1,000,000
- **Billing**: Enable billing for higher limits

Check quotas at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### Application Limits

- **Requests per IP**: 5 per 60 seconds
- **Image size**: Max 10 MB
- **Canvas size**: 640x480 pixels
- **Base64 timeout**: None (streaming)

## Monitoring & Logs

### Application Logs

In production, errors are logged to the server console:

```
palm-reader.error: GEMINI_API_KEY is not configured
palm-reader.error: Failed to parse Gemini response as JSON
palm-reader.error: Gemini API call failed: Error message
```

Check Vercel logs at: https://vercel.com/agss3199/topaitoolrank-website/logs

### API Usage

Monitor API usage in [Google Cloud Console](https://console.cloud.google.com/apis/dashboard):
- Navigate to: APIs & Services → Generative Language API → Usage
- Check quotas and rate limiting

## Development

### Testing Auto-Capture Logic

The auto-capture logic is tested in `__tests__/components.test.tsx`:

```bash
npm test -- palm-reader
```

Tests verify:
- ✅ Confidence threshold at 85%
- ✅ Stability threshold at 60 frames
- ✅ Centering logic works correctly
- ✅ Status messages display correctly

### Adjusting Thresholds

Edit `app/tools/palm-reader/lib/camera-constants.ts`:

```typescript
export const CONFIDENCE_THRESHOLD = 0.85;      // 85% minimum confidence
export const STABLE_FRAMES_REQUIRED = 60;      // ~2 seconds at 30fps
export const STABILITY_DELTA_THRESHOLD = 4;    // Max 4px movement
```

After changes:
```bash
npm test -- palm-reader              # Run tests to verify
npm run dev                           # Test locally
```

## Further Reading

- [Google Generative AI API Docs](https://ai.google.dev)
- [Gemini 2.0 Flash Model Guide](https://ai.google.dev/gemini-2)
- [Vision API Documentation](https://ai.google.dev/tutorials/vision_quickstart)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
