# Testing Your Deployed Backend

Your backend is live at: `https://website-q98y.vercel.app`

## Quick Tests in Browser

Just open these URLs in your browser (GET requests only):

1. **Root endpoint:**
   ```
   https://website-q98y.vercel.app/
   ```
   Should show: "fyp-backend is running — try GET /admin/users"

2. **Admin summary:**
   ```
   https://website-q98y.vercel.app/admin/summary
   ```
   Should return JSON with total users and foods

3. **Admin test endpoint:**
   ```
   https://website-q98y.vercel.app/admin/__test
   ```
   Should return: "Admin Router OK"

4. **Admin stats:**
   ```
   https://website-q98y.vercel.app/admin/stats
   ```
   Should return JSON with user statistics

## Using Browser Developer Tools

1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Paste and run these commands:

```javascript
// Test root endpoint
fetch('https://website-q98y.vercel.app/')
  .then(r => r.text())
  .then(console.log);

// Test admin summary
fetch('https://website-q98y.vercel.app/admin/summary')
  .then(r => r.json())
  .then(console.log);

// Test admin stats
fetch('https://website-q98y.vercel.app/admin/stats')
  .then(r => r.json())
  .then(console.log);
```

## Using curl (Command Line)

Open PowerShell (Windows) or Terminal (Mac/Linux):

```bash
# Test root
curl https://website-q98y.vercel.app/

# Test admin summary
curl https://website-q98y.vercel.app/admin/summary

# Test admin stats (pretty print JSON)
curl https://website-q98y.vercel.app/admin/stats | ConvertFrom-Json | ConvertTo-Json
```

## Using Postman or Insomnia

1. **Download Postman:** [postman.com](https://www.postman.com/downloads/)
2. Create a new request
3. Set method to `GET`
4. Enter URL: `https://website-q98y.vercel.app/admin/summary`
5. Click "Send"

## Test POST Endpoints (Admin Login)

For POST requests, you'll need to use curl, Postman, or JavaScript:

### Using curl:
```bash
curl -X POST https://website-q98y.vercel.app/admin/login \
  -H "Content-Type: application/json" \
  -d '{"token":"your-supabase-token-here"}'
```

### Using Browser Console:
```javascript
fetch('https://website-q98y.vercel.app/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'your-supabase-token-here'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Test All Available Endpoints

### GET Endpoints (test in browser):
- `/` - Root
- `/admin/__test` - Test route
- `/admin/summary` - System summary
- `/admin/stats` - User statistics
- `/admin/metrics/last7` - Last 7 days metrics
- `/admin/users` - List users (with pagination)
- `/admin/foods` - List foods (with pagination)
- `/admin/recognitions` - AI recognition logs
- `/admin/activity` - Activity logs
- `/admin/analytics` - Analytics data
- `/admin/apks` - APK versions

### POST Endpoints (need tool like Postman):
- `/admin/login` - Admin login
- `/admin/users` - Create user
- `/admin/foods` - Create food
- `/admin/activity` - Create activity log

## Quick Test Script

Save this as `test-backend.js` and run with `node test-backend.js`:

```javascript
const BASE_URL = 'https://website-q98y.vercel.app';

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`✅ ${name}:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  await testEndpoint('Root', `${BASE_URL}/`);
  await testEndpoint('Admin Test', `${BASE_URL}/admin/__test`);
  await testEndpoint('Summary', `${BASE_URL}/admin/summary`);
  await testEndpoint('Stats', `${BASE_URL}/admin/stats`);
  await testEndpoint('Users', `${BASE_URL}/admin/users?page=1&perPage=5`);
  await testEndpoint('Foods', `${BASE_URL}/admin/foods?page=1&perPage=5`);
  
  console.log('\n✅ All tests completed!');
}

runTests();
```

## Expected Responses

### `/admin/summary`
```json
{
  "success": true,
  "summary": {
    "total_users": 0,
    "total_foods": 0,
    "daily_checkins": 12,
    "recognitions_today": 3
  }
}
```

### `/admin/stats`
```json
{
  "success": true,
  "stats": {
    "total": 0,
    "onboarded": 0,
    "goals": {},
    "signup_trend": [...],
    "avgBmi": null
  }
}
```

## Troubleshooting

### If you get CORS errors:
- The backend already has CORS enabled
- Make sure you're testing from a browser or proper HTTP client

### If endpoints return 404:
- Check that the route exists in your `routes/admin.js`
- Verify the URL is correct (case-sensitive)

### If you get 500 errors:
- Check Vercel deployment logs
- Verify environment variables are set correctly
- Check Supabase connection

### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Click "View Function Logs" to see errors

