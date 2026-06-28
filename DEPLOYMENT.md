# Deployment Guide

## Quick Start

### Local Testing

```bash
cd proxy-pairing-web

# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

Then open: `http://localhost:8000`

---

## Production Deployment

### Option 1: Vercel (Recommended - Free & Easy)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd proxy-pairing-web
vercel --prod
```

Access at: `https://proxy-pairing.vercel.app` (custom domain available)

### Option 2: Netlify (Free & Easy)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd proxy-pairing-web
netlify deploy --prod
```

Access at: `https://proxy-pairing.netlify.app` (custom domain available)

### Option 3: GitHub Pages (Free)

```bash
# 1. Create a new repo on GitHub
# Name: proxy-pairing (or any name)
# Make it public

# 2. Initialize git
cd proxy-pairing-web
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/proxy-pairing.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to Settings > Pages > Source: main branch
# Access at: https://yourusername.github.io/proxy-pairing
```

### Option 4: Self-Hosted on Your Backend Server

**Using Nginx:**
```bash
sudo mkdir -p /usr/share/nginx/html/proxy
sudo cp -r proxy-pairing-web/* /usr/share/nginx/html/proxy/
sudo chown -R www-data:www-data /usr/share/nginx/html/proxy
```

**Using Apache:**
```bash
sudo mkdir -p /var/www/html/proxy
sudo cp -r proxy-pairing-web/* /var/www/html/proxy/
sudo chown -R www-data:www-data /var/www/html/proxy
```

Add to nginx/apache config:
```nginx
server {
    listen 443 ssl http2;
    server_name tv.playmetod.store;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /proxy {
        alias /usr/share/nginx/html/proxy;
        try_files $uri $uri/ /index.html;
    }
    
    # CORS headers for API
    location /app {
        proxy_pass http://backend:8000;
        add_header 'Access-Control-Allow-Origin' 'https://tv.playmetod.store' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

### Option 5: AWS S3 + CloudFront

```bash
# 1. Create S3 bucket
aws s3 mb s3://proxy-pairing --region us-east-1

# 2. Upload files
aws s3 sync proxy-pairing-web s3://proxy-pairing --delete

# 3. Enable static website hosting
aws s3 website s3://proxy-pairing --index-document index.html --error-document index.html

# 4. Create CloudFront distribution pointing to S3
# Then map custom domain via Route53
```

---

## Configuration for Production

### 1. Update API Endpoint

Edit `script.js`:
```javascript
const CONFIG = {
    API_BASE: 'https://tv.playmetod.store',  // Change this
};
```

### 2. Add CORS Headers to Backend

In `main.py` or your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tv.playmetod.store",
        "https://proxy.playmetod.store",  # If hosting separately
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
    max_age=3600,
)
```

### 3. Add Security Headers

For nginx:
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 4. Enable HTTPS

Use Let's Encrypt for free SSL:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tv.playmetod.store
```

### 5. Set Cache Headers

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location = /index.html {
    expires 0;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## Monitoring & Maintenance

### Enable Logging

Check access logs:
```bash
tail -f /var/log/nginx/access.log | grep proxy
```

Monitor errors:
```bash
tail -f /var/log/nginx/error.log
```

### Uptime Monitoring

Add to your monitoring (Uptime Robot, Pingdom, etc.):
- Endpoint: `https://tv.playmetod.store/proxy`
- Check frequency: Every 5 minutes
- Alert if down for 5+ minutes

### Error Tracking

Add to browser console logging (optional):
```javascript
// At end of script.js
window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
    // Could send to error tracking service
});
```

---

## Environment-Specific Configs

### Development
```
API_BASE: http://localhost:8000
```

### Staging
```
API_BASE: https://staging.playmetod.store
```

### Production
```
API_BASE: https://tv.playmetod.store
```

---

## Troubleshooting Deployment

**CORS Errors:**
- ✓ Check backend CORS middleware is configured
- ✓ Verify origin URL matches exactly

**404 on /proxy/index.html:**
- ✓ Add `try_files` to nginx config
- ✓ Set up error document for S3

**Slow performance:**
- ✓ Enable gzip compression in nginx
- ✓ Use CloudFront/CDN for static files
- ✓ Cache bust CSS/JS with version numbers

**Certificate errors:**
- ✓ Ensure HTTPS is enabled
- ✓ Check certificate is not expired
- ✓ Verify domain matches certificate

---

## Performance Optimization

Minify files for production:
```bash
# CSS
npx cssnano style.css -o style.min.css

# JavaScript  
npx terser script.js -o script.min.js

# Update HTML to use .min files
```

---

## Rollback Plan

Keep previous version as backup:
```bash
# Before deploying new version
aws s3 sync s3://proxy-pairing s3://proxy-pairing-backup-$(date +%Y%m%d)

# To rollback
aws s3 sync s3://proxy-pairing-backup-20240629 s3://proxy-pairing --delete
```

---

## Support

For deployment issues, check:
1. Backend logs: `tail -f /path/to/backend.log`
2. Nginx/Apache error logs
3. Browser console (F12 → Console tab)
4. Network tab to see API responses
