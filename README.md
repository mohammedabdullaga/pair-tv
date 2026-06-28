# Proxy Pairing Web Application

A modern, user-friendly web interface for configuring proxy settings on Playme TV devices using a 6-digit pairing code.

## Features

✅ **Easy to Use** - Simple form with clear instructions  
✅ **Mobile Friendly** - Responsive design works on any device  
✅ **Secure** - HTTPS encryption, codes expire after 10 minutes  
✅ **Real-time Validation** - Input validation and helpful error messages  
✅ **Dark/Light Support** - Automatically adapts to system theme  
✅ **Offline Detection** - Alerts user if connection is lost  

## File Structure

```
proxy-pairing-web/
├── index.html      # Main page structure
├── style.css       # Styling and responsive design
├── script.js       # Form handling and API integration
└── README.md       # This file
```

## Setup & Deployment

### Option 1: Static Hosting (Recommended)

Deploy as a static site on any hosting service:

**Vercel:**
```bash
npx vercel@latest
```

**GitHub Pages:**
1. Create a GitHub repo: `playme-proxy-config`
2. Push the files to `gh-pages` branch
3. Access at: `https://yourusername.github.io/playme-proxy-config`

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir .
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync . s3://your-bucket-name
```

### Option 2: Self-Hosted

Simply copy the folder to your web server:

```bash
# Copy to Apache
sudo cp -r proxy-pairing-web /var/www/html/proxy

# Copy to Nginx
sudo cp -r proxy-pairing-web /usr/share/nginx/html/proxy
```

Access at: `https://yourdomain.com/proxy`

### Option 3: Local Testing

For development/testing, start a simple HTTP server:

**Python 3:**
```bash
cd proxy-pairing-web
python -m http.server 8000
```

Access at: `http://localhost:8000`

**Node.js (http-server):**
```bash
npm install -g http-server
cd proxy-pairing-web
http-server
```

## Configuration

Edit `script.js` to configure the API endpoint:

```javascript
const CONFIG = {
    API_BASE: 'https://tv.playmetod.store',
    // For local testing, use:
    // API_BASE: 'http://localhost:8000',
};
```

## How It Works

### User Flow

1. **Get Pairing Code from TV**
   - TV displays 6-digit code: `582947`
   - Code is valid for 10 minutes

2. **Open Web Form**
   - User visits: `https://tv.playmetod.store/proxy`
   - Form asks for pairing code + proxy details

3. **Enter Proxy Details**
   - Pairing Code: `582947`
   - Proxy Host: `proxy.example.com`
   - Port: `1080`
   - Username: `myuser` (optional)
   - Password: `mypass` (optional)

4. **Submit**
   - Click "Send to TV"
   - Backend validates code and stores proxy config
   - TV automatically fetches and applies proxy

### API Endpoints Used

**Step 1: Submit Proxy Config**
```
POST /app/proxy/configure
Content-Type: application/json

{
  "pairing_code": "582947",
  "host": "proxy.example.com",
  "port": 1080,
  "username": "myuser",
  "password": "mypass"
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Proxy config saved for device AA:BB:CC:DD:EE:FF"
}
```

## Security Features

🔒 **HTTPS Only** - All communications encrypted  
🔒 **No Credentials Stored Locally** - Sent directly to backend  
🔒 **Code Expiration** - Codes expire after 10 minutes  
🔒 **MAC Address Verification** - Proxy linked to specific TV  
🔒 **No Admin Auth** - Device-initiated pairing  

## Troubleshooting

### "Invalid pairing code"
- ✓ Check the 6-digit code displayed on TV
- ✓ Make sure you entered all 6 digits
- ✓ Code expires after 10 minutes, get a new one

### "Network error"
- ✓ Check internet connection
- ✓ Verify API_BASE URL in `script.js`
- ✓ Check browser console for specific error

### "Could not reach the server"
- ✓ Verify backend is running
- ✓ Check CORS headers if API is on different domain
- ✓ Ensure HTTPS is used in production

### Form not submitting
- ✓ Fill all required fields (marked with *)
- ✓ Port must be 1-65535
- ✓ Check browser console for validation errors

## Browser Support

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Mobile browsers (iOS Safari, Chrome Android)  

## Development

### Adding CORS Support

If API is on different domain, add to backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tv.playmetod.store", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Customization

**Change Colors:**
Edit CSS variables in `style.css`:
```css
:root {
    --color-primary: #6366f1;  /* Change this */
}
```

**Change Domain:**
Edit `script.js`:
```javascript
const CONFIG = {
    API_BASE: 'https://your-domain.com',
};
```

**Add Custom Logo:**
Add to `index.html` in the `.header`:
```html
<img src="logo.png" alt="Logo" style="width: 60px; margin-bottom: 16px;">
```

## Performance

- **Total Size:** ~15 KB (HTML, CSS, JS)
- **Load Time:** <1 second on 4G
- **No Dependencies:** Pure HTML/CSS/JS
- **No Tracking:** No analytics or third-party scripts

## Production Checklist

- [ ] Update `API_BASE` to production URL
- [ ] Enable HTTPS
- [ ] Add CORS headers to backend
- [ ] Configure security headers (CSP, X-Frame-Options)
- [ ] Set appropriate cache headers
- [ ] Add favicon
- [ ] Update page title and meta tags
- [ ] Add custom domain (e.g., proxy.playme.tv)
- [ ] Test on mobile devices
- [ ] Set up monitoring/logging

## License

Same as Playme backend project

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review browser console for errors
3. Check backend logs for API errors
4. Contact backend team for API issues
# pair-tv
