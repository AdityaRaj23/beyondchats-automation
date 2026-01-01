# Vercel Deployment Guide

This guide will help you deploy the **frontend** of your BeyondChats Automation project to Vercel, specifically from the `supabase-version` branch.

## Prerequisites
- A [Vercel](https://vercel.com/signup) account.
- Your Code pushed to GitHub (branch `supabase-version`).

---

## Step 1: Push Code to GitHub
Ensure your local branch is pushed to GitHub.

```bash
git add .
git commit -m "Ready for deployment"
git push -u origin supabase-version
```

## Step 2: Import Project in Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** button (top right) -> **"Project"**.
3.  **Import Git Repository**: Find your repository in the list and click **"Import"**.

## Step 3: Configure Build Settings
Vercel should auto-detect Vite, but verify:
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` (Important! Your React app is inside this folder).
    - Click "Edit" next to Root Directory and select `frontend`.

## Step 4: Environment Variables
Add the Production Supabase keys here so your deployed app can talk to the database.

| Name | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://rhynbfdawxlbcatacjyu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *[Paste your anon key from Supabase Dashboard]* |

## Step 5: Deploy
1.  Click **"Deploy"**.
2.  Vercel will build your project.
3.  Once done, you will get a Production URL (e.g., `https://your-project.vercel.app`).

## Step 6: Deploying Specific Branch (`supabase-version`)
By default, Vercel deploys `main` to Production and other branches as "Preview".

**To make `supabase-version` your Production deployment:**
1.  Go to **Settings** > **Git** on your Vercel Project page.
2.  Scroll to **"Production Branch"**.
3.  Change it from `main` to `supabase-version`.
4.  Click **Save**.
5.  Go to the **Deployments** tab and redeploy the latest commit from `supabase-version` (or push a new commit to trigger it).
