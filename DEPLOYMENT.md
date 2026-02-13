# Alynne Davis Website — Deployment Guide

## Quick Summary
Static HTML/CSS/JS site. 10 pages + 10 blog posts. Zero frameworks. Ultra-lightweight.

## File Structure
```
site/
├── index.html                          # Homepage
├── about.html                          # About page
├── services.html                       # Services & pricing
├── eating-disorder-therapist.html      # Eating disorder therapy
├── trauma-informed-womens-therapy.html # Trauma therapy
├── expressive-arts-therapy.html        # Expressive arts
├── adhd-therapy.html                   # ADHD therapy
├── testimonials.html                   # Client testimonials
├── contact.html                        # Contact form
├── blog.html                           # Blog index
├── blog/                               # Blog posts (10 posts)
├── css/style.css                       # Single stylesheet
├── js/main.js                          # Minimal JS (~60 lines)
└── images/                             # SVG placeholders (replace with real images)
```

---

## Step 1: Replace Placeholder Images

Before deploying, you need to replace the SVG placeholders with real images from the current WordPress site.

### Images to download from current site:
1. **Logo (dark)**: `https://alynnedavis.com/wp-content/uploads/2024/12/Donna-Stroupe-1.png`
   → Save as: `images/alynne-davis-logo.png`
   → Update all HTML: change `.svg` to `.png` in logo references

2. **Logo (white/light)**: `https://alynnedavis.com/wp-content/uploads/2024/12/Donna-Stroupe.png`
   → Save as: `images/alynne-davis-logo-white.png`
   → Update all HTML: change `-white.svg` to `-white.png`

3. **Headshot**: `https://uscp1.therasoftclients.com/ALYNNE/wp-content/uploads/2024/11/alynne-davis-therapist-coach-666x1024-1.jpeg`
   → Save as: `images/alynne-davis-therapist-charlotte-nc.jpg`
   → Update HTML: change `.svg` to `.jpg`

### Quick replace command (run in site directory):
```bash
# After downloading images, update all references
find . -name "*.html" -exec sed -i 's/alynne-davis-logo\.svg/alynne-davis-logo.png/g' {} +
find . -name "*.html" -exec sed -i 's/alynne-davis-logo-white\.svg/alynne-davis-logo-white.png/g' {} +
find . -name "*.html" -exec sed -i 's/alynne-davis-therapist-charlotte-nc\.svg/alynne-davis-therapist-charlotte-nc.jpg/g' {} +
```

---

## Step 2: Deploy to GitHub Pages

### In Claude Code terminal:
```bash
# Navigate to site directory
cd ~/site

# Initialize git repo
git init
git add .
git commit -m "Initial site build — static HTML/CSS/JS"

# Create GitHub repo (requires gh CLI authenticated)
gh repo create alynnedavis-site --public --source=. --push

# Enable GitHub Pages
gh api -X PUT repos/YOUR_USERNAME/alynnedavis-site/pages \
  -f source.branch=main -f source.path=/
```

Site will be live at: `https://YOUR_USERNAME.github.io/alynnedavis-site/`

---

## Step 3: Supabase Contact Form (Later)

### Setup:
1. Create Supabase project at supabase.com (free tier)
2. Create table `contact_submissions`:
```sql
CREATE TABLE contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  service text,
  message text
);
```

3. Create Edge Function for form submission + Resend email notification
4. Update `js/main.js` with your Supabase URL

### Resend Setup:
1. Create account at resend.com (free: 100 emails/day)
2. Verify domain
3. Use API key in Supabase Edge Function

---

## Step 4: Custom Domain (Later)

When ready to point alynnedavis.com:
1. Add CNAME file to repo root: `echo "alynnedavis.com" > CNAME`
2. In domain registrar, point DNS to GitHub Pages:
   - A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME: YOUR_USERNAME.github.io
3. Enable HTTPS in GitHub Pages settings

---

## SEO Checklist (Already Done)
- [x] Semantic HTML5 structure (header, main, footer, section, article, nav)
- [x] Proper H1 → H2 → H3 hierarchy on every page
- [x] Unique title tags and meta descriptions per page
- [x] Open Graph tags on every page
- [x] Canonical URLs
- [x] Schema.org structured data (MentalHealthBusiness, BlogPosting)
- [x] Alt text on all images with keyword-rich descriptions
- [x] Internal linking with descriptive title attributes
- [x] Mobile-responsive design
- [x] Minimal JavaScript (non-blocking, deferred)
- [x] Single CSS file (no render-blocking overhead)

## Performance Notes
- Zero framework dependencies
- Single CSS file (~8KB)
- Single JS file (~2KB)
- Google Fonts loaded with preconnect
- Images lazy-loaded except above-fold logo
- Expected Lighthouse score: 95+ across all categories
