# Supabase Deployment Guide

This guide will help you deploy your **BeyondChats Automation** backend to Supabase Production.

## Prerequisites
- A [Supabase](https://supabase.com/) account.
- The `supbase` CLI installed (simulated via `npx supabase`).

---

## Step 1: Login to Supabase
You need to authenticate the CLI with your Supabase account.

1.  Run the following command in your terminal:
    ```bash
    npx supabase login
    ```
2.  Follow the instructions in the browser to generate an access token and paste it back into the terminal if requested (usually it auto-detects).

## Step 2: Create a Project
1.  Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Click **"New Project"**.
3.  Choose your organization, give it a name (e.g., `beyondchats-automation`), and set a secure database password (save this!).
4.  Select a region close to you (e.g., specific AWS region).
5.  Wait for the database to finish setting up (takes ~1-2 mins).

## Step 3: Link Project
Once your project is ready, you need its **Reference ID**.
- The Reference ID is the part of the URL after `project/`: `https://supabase.com/dashboard/project/abc-def-ghi` -> `abc-def-ghi`.

Run the link command:
```bash
npx supabase link --project-ref <YOUR_PROJECT_REF_ID>
```
*When asked for the database password, enter the one you created in Step 2.*

## Step 4: Push Database Schema
Now, deploy your local schema (migrations) to the production database:

```bash
npx supabase db push
```

## Step 5: Environment Variables
You need to update your GitHub Secrets (for Actions) and Vercel/Production Environment variables with the new Supabase credentials.

1.  **Get Credentials**:
    - Go to **Project Settings > API**.
    - Copy the `Project URL` and `anon`/`public` key.

2.  **Update `.env.production` (or your deployment platform)**:
    ```env
    VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
    VITE_SUPABASE_ANON_KEY=<your-anon-key>
    ```

3.  **For GitHub Actions (Scraper)**:
    - Add these to repository Secrets:
        - `VITE_SUPABASE_URL`
        - `SUPABASE_SERVICE_KEY` (Get this from Project Settings > API > `service_role` key - **Keep Secret!**)

## Step 6: Populate Data (Initial Run)
The database is currently empty. You can run the scraper locally to populate it with initial data.

1.  **Get Production Keys**:
    - Go to Supabase Dashboard > Project Settings > API.
    - Copy **Project URL** and **`service_role` secret** (not `anon`!).

2.  **Update `.env.local`**:
    Comment out your local keys and add the production ones:
    ```env
    VITE_SUPABASE_URL=https://rhynbfdawxlbcatacjyu.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key-here
    # ... keep other keys like GEMINI_API_KEY
    ```

3.  **Run the Scraper**:
    ```bash
    node scraper/phase1_scraper/scrapeBeyondChats.js
    ```
    *This will scrape articles and save them to your production database.*

## Verification
After ensuring `db push` was successful, you can visit the **Table Editor** in your Supabase Dashboard to see your `articles` table created.

