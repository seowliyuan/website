# Troubleshooting Vercel Deployment

## Error: "404: NOT_FOUND" / "DEPLOYMENT_NOT_FOUND"

This error means Vercel can't find your deployment. Here's how to fix it:

### Solution 1: Check Your Vercel Dashboard

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Check if your project exists:**
   - Look for project name: `website-q98y` (or `website-q89y`)
   - If it doesn't exist, you need to deploy it again

3. **Check deployment status:**
   - Click on your project
   - Go to "Deployments" tab
   - Check if the latest deployment is:
     - ✅ **Ready** (green) - Should work
     - ⏳ **Building** - Wait for it to finish
     - ❌ **Error** - Check the error logs

### Solution 2: Verify Root Directory

1. Go to your project settings in Vercel
2. Go to "General" → "Root Directory"
3. Make sure it's set to: `fyp-backend`
4. If it's wrong, change it and redeploy

### Solution 3: Check URL Typo

I noticed your URL shows `website-q89y.vercel.app` but earlier it was `website-q98y.vercel.app`.

**Check the correct URL:**
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Copy the exact production URL
- Use that URL (not a typo)

### Solution 4: Redeploy

If nothing works, try redeploying:

1. **Via Dashboard:**
   - Go to your project in Vercel
   - Click "Deployments"
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"

2. **Via Git:**
   - Make a small change to any file (add a comment)
   - Commit and push to GitHub
   - Vercel will auto-deploy

3. **Via CLI:**
   ```bash
   cd fyp-backend
   vercel --prod
   ```

### Solution 5: Check Build Logs

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click "View Build Logs"
4. Look for errors like:
   - "Cannot find module"
   - "Build failed"
   - "Missing file"

### Solution 6: Verify File Structure

Make sure your project has this structure:
```
fyp-backend/
├── api/
│   └── index.js          ← Must exist!
├── routes/
│   └── admin.js
├── vercel.json           ← Must exist!
└── package.json
```

### Solution 7: Check Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure all variables are set for **Production**
3. If you added new variables, **redeploy** (they only apply after redeploy)

## Common Issues

### Issue: "Cannot find module '../routes/admin.js'"
**Fix:** Make sure `routes/admin.js` exists and the path is correct in `api/index.js`

### Issue: Build succeeds but routes return 404
**Fix:** Check `vercel.json` - the `dest` should be `api/index.js` (no leading slash)

### Issue: Environment variables not working
**Fix:** 
1. Verify variables are set in Vercel
2. Make sure they're enabled for "Production"
3. **Redeploy** after adding variables

### Issue: CORS errors
**Fix:** Already handled in `api/index.js`, but if issues persist, check the CORS configuration

## Quick Checklist

Before asking for help, verify:
- [ ] Project exists in Vercel Dashboard
- [ ] Latest deployment is "Ready" (green)
- [ ] Root Directory is set to `fyp-backend`
- [ ] `api/index.js` file exists
- [ ] `vercel.json` file exists
- [ ] All environment variables are set
- [ ] Using the correct URL (check for typos)
- [ ] Tried redeploying

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Dashboard → Project → Deployments → Latest → View Function Logs
   - Look for runtime errors

2. **Test locally first:**
   ```bash
   cd fyp-backend
   npm install
   node server.js
   ```
   If it works locally but not on Vercel, it's a deployment config issue.

3. **Contact Vercel Support:**
   - Include your deployment URL
   - Include error messages from logs
   - Include your `vercel.json` content

