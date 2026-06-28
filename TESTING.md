# Testing Guide - Proxy Pairing Web Form

## Quick Test Locally

### 1. Start the Web Server

```bash
cd proxy-pairing-web
python -m http.server 8000
```

Open: `http://localhost:8000`

### 2. Make Sure Backend is Running

```bash
# In another terminal, from backend directory
python main.py
# or
uvicorn main:app --reload
```

### 3. Update Configuration for Local Testing

Edit `script.js` and change:

```javascript
const CONFIG = {
    API_BASE: 'http://localhost:8000',  // Change to localhost
};
```

### 4. Test the Form

**Option A: Test with Curl (Backend API)**

```bash
# Step 1: Get a pairing code
curl -X POST http://localhost:8000/app/proxy/pair \
  -H "Content-Type: application/json" \
  -d '{
    "mac_address": "AA:BB:CC:DD:EE:FF"
  }'

# Response should be:
# {
#   "pairing_code": "582947",
#   "expires_in_seconds": 600
# }
```

**Option B: Use the Web Form**

1. Open form in browser: `http://localhost:8000`
2. Fill in:
   - Pairing Code: `582947` (or generate new one)
   - Proxy Host: `proxy.example.com`
   - Port: `1080`
   - Username: `testuser`
   - Password: `testpass`
3. Click "Send to TV"

---

## Automated Test Suite

Create a test file: `test-proxy-form.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Proxy Form Test Suite</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .test { margin: 20px 0; padding: 10px; border: 1px solid #ccc; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>Proxy Form Test Suite</h1>
    <div id="results"></div>

    <script>
        const API_BASE = 'http://localhost:8000';
        const results = document.getElementById('results');

        async function test(name, fn) {
            try {
                await fn();
                log(name, true, 'PASS');
            } catch (e) {
                log(name, false, e.message);
            }
        }

        function log(name, pass, message) {
            const div = document.createElement('div');
            div.className = 'test ' + (pass ? 'pass' : 'fail');
            div.textContent = `${pass ? '✓' : '✗'} ${name}: ${message}`;
            results.appendChild(div);
        }

        async function runTests() {
            // Test 1: Can reach API
            await test('API Connectivity', async () => {
                const res = await fetch(`${API_BASE}/app/status`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            });

            // Test 2: Generate pairing code
            let pairingCode;
            await test('Generate Pairing Code', async () => {
                const res = await fetch(`${API_BASE}/app/proxy/pair`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mac_address: 'AA:BB:CC:DD:EE:FF' })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!data.pairing_code) throw new Error('No pairing code returned');
                pairingCode = data.pairing_code;
            });

            // Test 3: Check no proxy yet
            await test('Check Proxy (Before Config)', async () => {
                const res = await fetch(`${API_BASE}/app/proxy/paired/AA:BB:CC:DD:EE:FF`);
                if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
            });

            // Test 4: Submit proxy config
            await test('Submit Proxy Configuration', async () => {
                const res = await fetch(`${API_BASE}/app/proxy/configure`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pairing_code: pairingCode,
                        host: 'proxy.example.com',
                        port: 1080,
                        username: 'testuser',
                        password: 'testpass'
                    })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.status !== 'ok') throw new Error('Status not ok');
            });

            // Test 5: Check proxy config received
            await test('Fetch Proxy Configuration', async () => {
                const res = await fetch(`${API_BASE}/app/proxy/paired/AA:BB:CC:DD:EE:FF`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.host !== 'proxy.example.com') throw new Error('Host mismatch');
                if (data.port !== 1080) throw new Error('Port mismatch');
            });

            // Test 6: Invalid code should fail
            await test('Reject Invalid Pairing Code', async () => {
                const res = await fetch(`${API_BASE}/app/proxy/configure`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pairing_code: '999999',
                        host: 'test.com',
                        port: 1080
                    })
                });
                if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
            });

            log('Test Suite', true, 'Complete');
        }

        runTests();
    </script>
</body>
</html>
```

Save and open this file in browser to run all tests automatically.

---

## Manual Testing Checklist

### Form Input Validation

- [ ] Pairing code accepts only 6 digits
- [ ] Pairing code auto-trims/formats input
- [ ] Port number accepts 1-65535
- [ ] Port number rejects negative/>65535
- [ ] Host field is required
- [ ] Username/password fields are optional
- [ ] Form shows validation errors for required fields

### UI/UX Testing

- [ ] Form displays correctly on mobile
- [ ] Form displays correctly on desktop
- [ ] Password field toggle button works
- [ ] "Send to TV" button disables during submission
- [ ] Error messages display clearly
- [ ] Success message shows after submission
- [ ] Loading spinner appears during submission
- [ ] Form autofocuses on pairing code input
- [ ] Enter key submits form (when valid)

### API Integration

- [ ] Form sends POST to `/app/proxy/configure`
- [ ] Correct headers are sent (Content-Type)
- [ ] Request body matches API spec
- [ ] Success (200) shows success message
- [ ] Error (400) shows error details
- [ ] Error (404) shows helpful message
- [ ] Network errors handled gracefully

### Security

- [ ] Form uses HTTPS in production
- [ ] Password field is masked by default
- [ ] Password toggle works correctly
- [ ] No credentials stored in localStorage
- [ ] No API key visible in code
- [ ] CORS headers handled correctly

### Browser Compatibility

- [ ] Chrome latest ✓
- [ ] Firefox latest ✓
- [ ] Safari latest ✓
- [ ] Edge latest ✓
- [ ] Mobile Safari (iOS) ✓
- [ ] Chrome Mobile (Android) ✓

### Performance

- [ ] Page loads in <1 second
- [ ] Form submission completes in <5 seconds
- [ ] No console errors or warnings
- [ ] No memory leaks on repeated submissions
- [ ] Works on slow 3G connection

---

## Testing Different Scenarios

### Scenario 1: Successful Proxy Configuration

```
1. Open form at http://localhost:8000
2. Generate code: curl -X POST http://localhost:8000/app/proxy/pair ...
3. Enter code in form
4. Fill proxy details
5. Submit
6. See success message
7. Refresh page - form should reset
✓ Expected: "Proxy sent successfully!" message
```

### Scenario 2: Expired Pairing Code

```
1. Generate code
2. Wait 10+ minutes (or manually delete from DB)
3. Enter old code in form
4. Submit
✗ Expected: "Pairing code expired" error
```

### Scenario 3: Invalid Pairing Code

```
1. Enter random code (e.g., 123456)
2. Submit
✗ Expected: "Invalid pairing code" error
```

### Scenario 4: Missing Required Fields

```
1. Leave Proxy Host empty
2. Try to submit
✗ Expected: Form validation prevents submission
```

### Scenario 5: Invalid Port Number

```
1. Enter port 99999 (too high)
2. Try to submit
✗ Expected: Form shows port error or caps at 65535
```

### Scenario 6: Network Disconnection

```
1. Fill form
2. Disconnect internet
3. Submit
✗ Expected: "Network error" message
4. Reconnect
5. Try again
✓ Expected: Should succeed
```

---

## Debugging Tips

### Check Browser Console

Press F12, go to Console tab, look for:
- JavaScript errors
- Network request details
- API response messages

### Check Network Tab

Press F12, go to Network tab:
1. Fill and submit form
2. Look for POST to `/app/proxy/configure`
3. Click request, check:
   - Request Headers
   - Request Payload
   - Response Status
   - Response Body

### Common Issues & Solutions

**CORS Error:**
```
Error: Access to XMLHttpRequest blocked by CORS policy
Solution: Update script.js API_BASE to match backend
Solution: Add CORS middleware to FastAPI app
```

**404 on API endpoint:**
```
Error: 404 Not Found
Solution: Ensure backend is running on correct port
Solution: Verify endpoint path in script.js
```

**Form won't submit:**
```
Check form validation:
- All fields filled correctly
- Port is valid number
- Pairing code is 6 digits
Check browser console for errors
```

---

## Load Testing

Simulate 100 concurrent users:

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test endpoint
ab -n 1000 -c 100 http://localhost:8000/
```

Expected results:
- <100ms response time per request
- <1% error rate
- Proper error handling under load

---

## Accessibility Testing

Screen reader test (on macOS):
```
Press Cmd+F5 to enable VoiceOver
Navigate form with Tab key
Verify all labels are read correctly
```

Keyboard navigation:
- Tab through all inputs ✓
- Shift+Tab reverse navigation ✓
- Enter submits form ✓
- Password toggle accessible ✓

---

## Final Sign-Off Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Works offline/low connectivity
- [ ] Backend CORS configured
- [ ] API endpoint matches script.js
- [ ] Security measures in place
- [ ] Ready for production deployment
