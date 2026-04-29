# Discord Webhook Setup Guide

Super simple! Get contact form submissions directly in Discord. **Completely free, no signup needed** (if you already have Discord).

---

## Features

- ✅ **Free** - Discord is free
- ✅ **No email** needed
- ✅ **No backend** - Works on GitHub Pages
- ✅ **Real-time** - Submissions appear instantly
- ✅ **Beautiful** - Formatted Discord embeds
- ✅ **No storage** - Submissions only in Discord

---

## Setup (2 minutes)

### Step 1: Create Discord Server (Skip if you have one)

1. Go to Discord: https://discord.com/app
2. Click **"+"** button on the left sidebar
3. Click **"Create My Own"**
4. Name it: **"Top AI Tool Rank"**
5. Click **"Create"**

### Step 2: Create Channel

1. In your server, right-click the server name
2. Click **"Create Channel"**
3. Name: **`contact-submissions`** or **`leads`**
4. Type: **Text Channel**
5. Click **"Create Channel"**

### Step 3: Create Webhook

1. In your channel, click the **gear icon** (settings)
2. Go to **"Integrations"** (left sidebar)
3. Click **"Create Webhook"**
4. Name it: **"Contact Form Bot"**
5. Click **"Copy Webhook URL"**
6. **SAVE THIS URL** somewhere safe (you'll need it in 1 minute)

### Step 4: Update Your Website

1. Open `js/main.js` in your code editor
2. Find this line (near the top):
   ```javascript
   const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';
   ```
3. Replace `YOUR_DISCORD_WEBHOOK_URL` with the URL you just copied
4. Should look like:
   ```javascript
   const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1234567890/abcdefghijklmno-xyz';
   ```
5. **Save the file**

### Step 5: Push to GitHub

```bash
git add .
git commit -m "feat: add Discord webhook for contact form submissions"
git push origin master
```

---

## Done! ✅

Now when someone fills out the contact form on your website:
1. They click "Send Message"
2. Message appears in your Discord channel **instantly**
3. You can reply directly in Discord

---

## What You'll See in Discord

```
📬 New Contact Form Submission

👤 Name
John Smith

📧 Email  
john@example.com

💬 Message
I'm interested in a custom software project...

From: topaitoolrank.com
```

---

## Troubleshooting

### "Not receiving messages"

1. **Check webhook URL** is correct in `js/main.js`
2. **Check Discord channel** has the webhook
3. **Check browser console** for errors (F12 → Console)
4. **Test the form** - you should see success message

### "How do I reply to submissions?"

Just reply in Discord! There's no automatic reply system, but you can:
1. See the email in Discord
2. Manually email them back at their address
3. Or click "Open in browser" → use Discord's built-in reply features

### "Can I receive emails too?"

You can set up Discord notifications:
1. In Discord, go to **User Settings** → **Notifications**
2. Set **"Direct Messages"** to **Ping**
3. You'll get notified on your phone/desktop when messages arrive

---

## Security Notes

- ✅ Your webhook URL is **public** (anyone could post to it if they had the URL)
- ✅ But that's okay - it just means spam messages go to your Discord
- ✅ You can delete/recreate the webhook anytime
- ✅ **Don't** commit the webhook URL to public repos (it's already public anyway, but good practice)

---

## Advanced: Use Environment Variables (Optional)

If you want to keep the webhook URL secret:

1. In your repo, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `DISCORD_WEBHOOK_URL`
4. Value: Your webhook URL
5. Save

Then use a GitHub Actions workflow to inject it (requires more setup).

For now, just putting it in `js/main.js` is fine.

---

## Multiple Channels

Want submissions in different channels? Just create multiple webhooks:

```javascript
// Option 1: General contacts
const GENERAL_WEBHOOK = 'https://discord.com/api/webhooks/...';

// Option 2: Support requests
const SUPPORT_WEBHOOK = 'https://discord.com/api/webhooks/...';

// Then check form type and send to right webhook
```

---

## Webhooks Dashboard

To manage your webhooks:
1. In Discord, go to channel settings
2. Click **"Integrations"**
3. See all webhooks for that channel
4. Delete any you don't want

---

## Cost

**Free forever!**
- Discord: Free
- Webhooks: Free
- No limits on messages

---

## Next Steps

1. **Follow the 4 steps** above
2. **Test** by submitting the contact form
3. **Check Discord** - your message should appear
4. **Done!** You're live 🚀

---

## Questions?

- Discord Webhook Docs: https://discord.com/developers/docs/resources/webhook
- Create Discord App: https://discord.com/developers/applications

Enjoy! 🎉
