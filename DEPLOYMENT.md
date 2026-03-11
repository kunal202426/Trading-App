# 🚀 Deployment Guide 

This guide will help you deploy your trading platform live on the internet for FREE.

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ GitHub repository created (Done! ✓)
- ✅ Code pushed to GitHub (Done! ✓)
- 🔑 Firebase credentials ready

---

## 🌐 Deploy Frontend to Vercel (Recommended - FREE)

Vercel is perfect for React/Vite apps and offers free hosting with automatic HTTPS and global CDN.

### Step 1: Sign Up for Vercel

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project

1. Click **"Add New Project"** or **"Import Project"**
2. Find and select your `Stock-Prediction` repository
3. Click **"Import"**

### Step 3: Configure Build Settings

Vercel should auto-detect your settings, but verify:

- **Framework Preset:** Vite
- **Root Directory:** `stock-ui` ⬅️ **IMPORTANT!**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Add Environment Variables

Click on **"Environment Variables"** and add these (get from your Firebase console):

```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. **Your site is LIVE!** 🎉

You'll get a URL like: `https://stock-prediction-xxx.vercel.app`

### Optional: Add Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain (if you have one)
3. Follow DNS setup instructions

---

## 🐍 Deploy Backend API (Optional)

### Option 1: Render (FREE Tier)

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your `Stock-Prediction` repository
5. Configure:
   - **Name:** `yes-securities-api`
   - **Root Directory:** Leave blank (uses root)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api:app --host 0.0.0.0 --port $PORT`
6. Click **"Create Web Service"**

Your API will be live at: `https://yes-securities-api.onrender.com`

### Option 2: Railway (FREE Tier)

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway auto-detects Python and deploys!

---

## 📦 Create requirements.txt for Backend

If you don't have a `requirements.txt` file, create one in the project root:

```txt
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
yfinance==0.2.32
firebase-admin==6.3.0
python-dotenv==1.0.0
```

Add and push it:
```bash
cd /c/Users/kunal/Desktop/Stock_prediction
git add requirements.txt vercel.json DEPLOYMENT.md
git commit -m "Add deployment configuration files"
git push origin main
```

---

## 🔗 Update API URL in Frontend

Once your backend is deployed, update the API URL in your frontend code:

**File:** `stock-ui/src/pages/Dashboard.jsx` (and other pages that call the API)

```javascript
// Change from localhost to your deployed backend URL
const API_URL = 'https://yes-securities-api.onrender.com';  // Update this
```

Then redeploy on Vercel (it auto-deploys on every git push!).

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Landing page loads and animations work
- [ ] Login/Signup pages work
- [ ] Firebase authentication working
- [ ] Can create an account
- [ ] Can log in successfully
- [ ] Protected routes redirect to landing when logged out
- [ ] Ticker strip animates smoothly
- [ ] Parallax scrolling works
- [ ] Favicon appears in browser tab

---

## 🛠️ Troubleshooting

### Build Failed on Vercel

**Error:** "Cannot find module 'lenis'"

**Solution:** Make sure all dependencies are in `stock-ui/package.json`. Run:
```bash
cd stock-ui
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Environment Variables Not Working

**Error:** Firebase initialization failed

**Solution:**
1. Double-check all environment variables in Vercel dashboard
2. Make sure they start with `VITE_` prefix
3. Redeploy after adding variables

### 404 on Refresh

**Solution:** Already fixed! The `vercel.json` file handles this with rewrites.

---

## 📊 Free Tier Limits

### Vercel
- ✅ Unlimited websites
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deploy on git push

### Render/Railway (Backend)
- ✅ 750 hours/month (enough for 24/7!)
- ✅ Automatic HTTPS
- ⚠️ Sleeps after 15 min inactivity (free tier)
- ⚠️ Takes ~30s to wake up on first request

---

## 🎯 Next Steps

1. **Share your live URL** with friends, recruiters, or on LinkedIn
2. **Add to your resume** as a live project
3. **Monitor usage** on Vercel/Render dashboards
4. **Iterate and improve** - every git push auto-deploys!

---

## 📱 Your Live URLs

After deployment, update these:

- **Frontend (Vercel):** `https://your-app.vercel.app`
- **Backend (Render/Railway):** `https://your-api.onrender.com`
- **GitHub Repo:** https://github.com/kunal202426/Stock-Prediction

---

**Built by Kunal Mathur** | Full Stack Developer Intern, Bengaluru
