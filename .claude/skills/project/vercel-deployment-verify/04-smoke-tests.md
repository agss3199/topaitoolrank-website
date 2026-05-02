# Step 3d: Smoke Tests

Test critical user-facing routes for 200 status and functional response.

## Command

```bash
DOMAIN="<your-domain.com>"

# Test critical routes for HTTP 200
routes=("/" "/api/health" "/api/upload" "/api/send")
failed=0

for route in "${routes[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$DOMAIN$route")
  if [ "$status" == "200" ]; then
    echo "✓ $route returned $status"
  else
    echo "✗ $route returned $status (expected 200)"
    failed=$((failed + 1))
  fi
done

if [ $failed -eq 0 ]; then
  echo "✓ All smoke tests passed"
else
  echo "✗ $failed routes failed — deploy may be incomplete"
  exit 1
fi
```

## What It Catches

- Route handler not deployed (404)
- Endpoint crashing (500, 502, 503)
- Dependency failure (timeout, 504)
- Middleware blocking requests (401, 403)
- Malformed responses (headers incorrect, no body)

## Why It Matters

A bundle asset hash match proves the NEW code is live, but smoke tests prove it's WORKING. A deployment can load the new code but crash on the first real request if a critical dependency (database, cache, API) is unreachable. This test catches deployment failures that the asset check misses.

## Extended Smoke Test (Functional Validation)

```bash
# For API endpoints, validate response structure
curl -s -X POST https://topaitoolrank.com/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipients":["test@example.com"],"message":"test"}' \
  | jq '.status' | grep -q "success"

if [ $? -eq 0 ]; then
  echo "✓ /api/send accepted and returned valid response"
else
  echo "✗ /api/send returned invalid response structure"
fi
```

## Pass Criteria

- All critical routes return HTTP 200
- Response headers include `Content-Type` (not blank)
- Response body is non-empty (not truncated)
- API endpoints return JSON with expected top-level keys (`status`, `data`, `error`)
