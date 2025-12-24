# Deploying Backend to Vercel

This guide will help you deploy your Express.js backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for CLI deployment)
3. Your environment variables ready

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

   - Make sure your `fyp-backend` folder is in a Git repository
   - Push all changes to your remote repository

2. **Import Project to Vercel**

   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - **Important**: Set the "Root Directory" to `fyp-backend` (not the root of your repo)

3. **Configure Build Settings**

   - Framework Preset: "Other"
   - Build Command: Leave empty (or `npm install` if needed)
   - Output Directory: Leave empty
   - Install Command: `npm install`

4. **Add Environment Variables**

   - In the Vercel project settings, go to "Environment Variables"
   - **Copy ALL variables from your `.env` file** - add each one:
     - Click "Add New"
     - Enter the variable name (e.g., `SUPABASE_URL`)
     - Enter the variable value (copy from your `.env` file)
     - Select environments: Production, Preview, and Development (or just Production)
     - Click "Save"
   - Repeat for each variable in your `.env` file

   **Common variables you might have:**

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `SUPABASE_ANON_KEY`
   - `PORT` (optional - Vercel handles this automatically)
   - Any other custom variables your app uses

5. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)

   ```bash
   npm i -g vercel
   ```

2. **Navigate to backend directory**

   ```bash
   cd fyp-backend
   ```

3. **Login to Vercel**

   ```bash
   vercel login
   ```

4. **Deploy**

   ```bash
   vercel
   ```

   - Follow the prompts
   - When asked for "Root Directory", enter `.` (current directory)
   - When asked to override settings, say "No" (use the vercel.json we created)

5. **Set Environment Variables**

   ```bash
   # Add each variable from your .env file
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE
   vercel env add SUPABASE_ANON_KEY
   # Add ALL other variables from your .env file
   # Example: vercel env add YOUR_OTHER_VAR
   ```

   **Tip:** Copy the exact variable names and values from your `.env` file. You'll be prompted to enter the value for each variable.

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Project Structure

The deployment uses this structure:

```
fyp-backend/
├── api/
│   └── index.js          # Serverless function entry point
├── routes/               # Your Express routes
├── services/            # Supabase and other services
├── utils/               # Utility functions
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies
```

## Environment Variables

Make sure to set these in Vercel:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE` - Your Supabase service role key (for admin operations)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key (for public operations)
- Any other variables your app needs

## Testing Your Deployment

After deployment, Vercel will give you a URL like:
`https://your-project.vercel.app`

Test your endpoints:

- `https://your-project.vercel.app/` - Should return "fyp-backend is running..."
- `https://your-project.vercel.app/admin/summary` - Should return summary data

## Troubleshooting

### Routes not working

- Make sure `vercel.json` is in the `fyp-backend` directory
- Check that `api/index.js` exists and exports the Express app correctly

### Environment variables not working

- Make sure you've added them in Vercel dashboard
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### Build errors

- Check that all dependencies are in `package.json`
- Make sure Node.js version is compatible (Vercel uses Node 18.x by default)

### CORS issues

- The CORS middleware is already configured in `api/index.js`
- If you need to allow specific origins, update the CORS configuration

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Continuous Deployment

Once connected to Git, Vercel will automatically deploy:

- Every push to `main`/`master` branch → Production
- Every push to other branches → Preview deployment

## Notes

- Vercel uses serverless functions, so your Express app runs as a serverless function
- Cold starts may occur on first request after inactivity
- Function timeout is 10 seconds on Hobby plan, 60 seconds on Pro plan
- For long-running operations, consider using Vercel's background functions
