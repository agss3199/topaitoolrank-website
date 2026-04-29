# EmailJS Setup Guide

EmailJS is a **completely free** service that allows you to send emails directly from your website without needing a backend server. Perfect for static sites on GitHub Pages!

## Features

- ✅ **Free** - 200 emails/month on free tier (more than enough)
- ✅ **No backend needed** - Works client-side
- ✅ **Emails go to your inbox** - No signup required from users
- ✅ **Simple setup** - Takes 5 minutes
- ✅ **Secure** - Uses your email provider (Gmail, Outlook, etc.)

---

## Setup Steps (5 minutes)

### 1. Create EmailJS Account

1. Go to: https://www.emailjs.com/
2. Click **Sign Up** (top right)
3. Choose **Sign up with Google** or email
4. Verify your email

### 2. Add Your Email Provider

1. In EmailJS dashboard, go to **Email Services** (left sidebar)
2. Click **Add Service**
3. Choose your email provider:
   - **Gmail** (recommended - most reliable)
   - **Outlook**
   - **Yahoo Mail**
   - **Custom SMTP**
4. Follow the prompts:
   - For **Gmail**: You'll need an "App Password" (2-step verification required)
   - [Gmail App Password Guide](https://support.google.com/accounts/answer/185833)

### 3. Create Email Template

1. Go to **Email Templates** (left sidebar)
2. Click **Create New Template**
3. Name it: `contact_form` (or whatever you want)
4. Paste this template:

```
From: {{from_email}}
Name: {{from_name}}

Message:
{{message}}

---
Reply to: {{reply_to}}
```

5. Fill in:
   - **To Email:** `{{to_email}}` (this is a variable - keeps it dynamic)
   - **Subject:** `New Contact Form Submission from {{from_name}}`
   - **Body:** (use template above)
6. Click **Save**

### 4. Get Your Keys

You need 3 pieces of information:

1. **Public Key**
   - Go to **Account** (top right menu)
   - Copy your **Public Key**

2. **Service ID**
   - Go to **Email Services**
   - Click on your service (Gmail, etc.)
   - Copy the **Service ID**

3. **Template ID**
   - Go to **Email Templates**
   - Click on your template (`contact_form`)
   - Copy the **Template ID**

### 5. Update Your Website

In your website files, find and replace these 3 values in `js/main.js`:

```javascript
emailjs.init('YOUR_PUBLIC_KEY');  // Line ~3

'YOUR_SERVICE_ID',      // Line ~41
'YOUR_TEMPLATE_ID',     // Line ~42
```

Replace with your actual keys:
```javascript
emailjs.init('abc123xyz789...');  // Your actual public key

'gmail_123456789',      // Your actual service ID
'template_abc123',      // Your actual template ID
```

### 6. Test It!

1. Go to your website: `https://topaitoolrank.com`
2. Fill in the contact form
3. Click "Send Message"
4. Check your email inbox for the submission
5. Done! ✅

---

## Updating the Code

### Option A: Manual Edit (Recommended)

1. Open `js/main.js` in your code editor
2. Find lines with `YOUR_PUBLIC_KEY`, `YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID`
3. Replace with your actual keys from EmailJS
4. Save
5. Commit to Git: `git add . && git commit -m "feat: add EmailJS credentials"`
6. Push: `git push origin master`

### Option B: Use Environment Variables (Advanced)

If you don't want to commit credentials, use GitHub Secrets:

1. Go to your repo: https://github.com/agss3199/topaitoolrank-website
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secrets:
   - `EMAILJS_PUBLIC_KEY`
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`

Then use a build process to inject them (requires GitHub Actions workflow).

---

## Troubleshooting

### "Email not sending"
- Check your service is **Connected** in EmailJS (Email Services page)
- Verify template **ID** is correct
- Try sending a **test email** from EmailJS dashboard

### "Too many requests"
- You've hit the free tier limit (200/month)
- Upgrade to paid plan or wait for next month

### "Invalid recipient"
- Check `to_email` in the code matches your email address

### "CORS error"
- Make sure your website is added to EmailJS **Authorized Domains**
- Go to **Account** → **Security**
- Add your domain: `topaitoolrank.com`

---

## Upgrading Later

Free tier includes:
- ✅ 200 emails/month
- ✅ 1 email service
- ✅ 1 email template
- ✅ 1 SMS provider

Paid plans ($14.99/month) include:
- ✅ Unlimited emails
- ✅ Multiple services
- ✅ Multiple templates
- ✅ Priority support

---

## Cost Comparison

| Service | Cost | Limits |
|---------|------|--------|
| **EmailJS Free** | $0 | 200/month |
| **EmailJS Pro** | $14.99/month | Unlimited |
| **Formspree** | $25/month | Unlimited |
| **Basin** | $0 | 100/month |
| **Web3Forms** | $0 | Unlimited |

EmailJS free tier is perfect for a new business website!

---

## Contact Form Features

Your contact form now:
- ✅ Validates email format
- ✅ Shows loading state
- ✅ Displays success/error messages
- ✅ Sends emails to your inbox
- ✅ No dependencies on backend servers
- ✅ Works on GitHub Pages
- ✅ User data never stored on servers

---

## Questions?

- EmailJS Docs: https://www.emailjs.com/docs/
- EmailJS Support: https://www.emailjs.com/support/
