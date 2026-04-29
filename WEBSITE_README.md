# Top AI Tool Rank Website

A modern, high-performance website for showcasing custom software development services and SaaS tools.

## Features

- **Single-page scroll design** with smooth navigation
- **3D particle network animation** in hero section (Three.js)
- **Fully responsive** design (desktop, tablet, mobile)
- **SEO optimized** with JSON-LD schema, meta tags, sitemap, and robots.txt
- **Google Analytics 4** integration ready
- **No build tools** - pure HTML, CSS, JavaScript
- **Fast loading** - optimized assets, lazy loading
- **Accessible** - semantic HTML, WCAG compliance

## Project Structure

```
├── index.html                 # Main homepage (all sections in one page)
├── privacy-policy.html        # Privacy policy page
├── terms.html                 # Terms of service page
├── blogs/
│   └── index.html             # Blog landing (coming soon)
├── css/
│   ├── style.css              # Main stylesheet
│   └── animations.css         # Animation effects
├── js/
│   ├── main.js                # Navigation, interactivity
│   └── scene.js               # Three.js 3D scene
├── robots.txt                 # SEO - search engine crawling
├── sitemap.xml                # SEO - all pages index
├── CNAME                      # GitHub Pages custom domain
└── WEBSITE_README.md          # This file
```

## Setup & Deployment

### Local Testing

1. Open `index.html` in your browser (or use a local server)
2. Test all navigation links and responsive design
3. Check 3D animation loads properly
4. Verify Google Analytics placeholder code

### GitHub Pages Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: add topaitoolrank.com website"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Source: Deploy from `main` branch, root `/`
   - Click Save

3. **Connect Custom Domain**
   - GitHub will auto-detect `CNAME` file
   - At your domain registrar (Namecheap, GoDaddy, etc.):
     - Add `CNAME` record: `topaitoolrank.com` → `<your-username>.github.io`
     - Wait 24 hours for DNS propagation
   - GitHub will auto-issue HTTPS certificate

4. **Test Your Site**
   - Visit `https://topaitoolrank.com`
   - Verify all pages load
   - Check Lighthouse score
   - Test mobile responsiveness

## Configuration

### Update Google Analytics

Replace `G-XXXXXXXXXX` with your GA4 Measurement ID:

1. Get your GA4 ID from [Google Analytics](https://analytics.google.com)
2. In `index.html` (2 places):
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ID"></script>
   <script>
       gtag('config', 'YOUR_ID');
   </script>
   ```

### Update Contact Form

Replace `YOUR_FORM_ID` in the contact form with a Formspree ID:

1. Go to [formspree.io](https://formspree.io)
2. Create a new form for `contact@topaitoolrank.com`
3. Get your form ID
4. In `index.html` and `blogs/index.html`:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

## Adding New Tools

To add a new tool to the Tools menu:

1. Edit `index.html` - find the `<li>` items in `.dropdown`
2. Add a new line:
   ```html
   <li><a href="https://your-tool-url.vercel.app" target="_blank" rel="noopener">Tool Name</a></li>
   ```
3. Update `sitemap.xml` to include the new tool's page (if it has one)
4. Commit and push - done!

## Performance Optimization

- **CSS Variables** - easy color theming
- **Lazy Loading** - images load on demand
- **Responsive Images** - optimized for all screen sizes
- **Minimized 3D** - 100 particles max, pauses off-screen
- **CDN Libraries** - Three.js, no local build step

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## SEO Checklist

- ✅ Meta tags (title, description) on all pages
- ✅ Open Graph tags for social sharing
- ✅ JSON-LD schema (Organization, BreadcrumbList)
- ✅ Semantic HTML (h1, h2, proper structure)
- ✅ Responsive design (mobile-first)
- ✅ Image alt text
- ✅ Fast loading (Lighthouse 90+)
- ✅ robots.txt and sitemap.xml
- ✅ HTTPS (auto via GitHub Pages)
- ✅ Canonical URLs

## Next Steps

1. **Blog Content** - Add actual blog articles to `/blogs/` (create individual post pages)
2. **Contact Email** - Set up Formspree for contact form submissions
3. **Analytics** - Replace GA4 placeholder with your measurement ID
4. **Case Studies** - Add your custom software projects/portfolio
5. **SEO Monitoring** - Submit sitemap to Google Search Console, Bing Webmaster
6. **Performance** - Monitor with PageSpeed Insights, Lighthouse

## Support

For questions about the website setup:
- Contact: contact@topaitoolrank.com
- Website: https://topaitoolrank.com

---

Built with HTML5, CSS3, Vanilla JavaScript, and Three.js
