# Step 3b: Traffic Distribution Check

Verify the new revision is receiving 100% of production traffic.

## Command

```bash
DOMAIN="<your-domain.com>"
vercel inspect $DOMAIN --json | jq '{readyState, target, createdAt}'
```

Expected output:
```json
{
  "target": "production",
  "readyState": "READY"
}
```

## What It Catches

- New revision deployed but old revision still serving all traffic
- Traffic split misconfigured (canary deploy not completed)
- Deployment not promoted to production
- Wrong URL being checked

## Why It Matters

A deployment can be live but unreachable if the alias (your domain) still points to the previous revision. This check confirms the domain routing is correct.
