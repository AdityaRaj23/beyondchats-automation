# Deployment Guide

This project consists of three parts that need to be deployed:
1.  **Backend**: PocketBase (Database & API)
2.  **Frontend**: React + Vite (User Interface)
3.  **Automation**: Node.js Scripts (Scraper & Enricher)

Here are two recommended ways to deploy this stack.

---

## Option 1: Supabase (Recommended) ⚡️
*Best for scalability, built-in Auth, and easy management.*

**Full Guide:** See [SUPABASE_GUIDE.md](./SUPABASE_GUIDE.md)

1.  **Backend**: [Supabase](https://supabase.com/)
    - Stores `articles` and potentially auth users.
    - Managed Postgres database.
    - **Deployment**: Follow `SUPABASE_GUIDE.md` to link and push your schema.

2.  **Frontend**: Vercel
    - **Deployment**: Follow `VERCEL_GUIDE.md` to deploy your `supabase-version` branch.
    - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.


### 2. Frontend: Vercel
1.  Push your code to **GitHub**.
2.  Go to [Vercel](https://vercel.com/) and "Add New Project".
3.  Select your repository.
4.  **Build Settings**: Vercel usually detects Vite automatically.
    - Framework: `Vite`
    - Build Command: `npm run build`
    - Output Directory: `dist`
5.  **Environment Variables**:
    - `VITE_POCKETBASE_URL`: Set this to your PocketHost URL (e.g., `https://beyondchats-demo.pockethost.io`).
    *Note: You need to update `frontend/src/lib/pocketbase.js` to use `import.meta.env.VITE_POCKETBASE_URL` instead of localhost.*
6.  Deploy! 🚀

### 3. Automation: GitHub Actions
Run the scraper and enrichment scripts on a schedule (e.g., every 6 hours).

1.  Add your secrets to GitHub (Settings > Secrets and variables > Actions):
    - `PB_ADMIN_EMAIL`
    - `PB_ADMIN_PASSWORD`
    - `GEMINI_API_KEY`
    - `SERPER_API_KEY`
2.  Create a workflow file `.github/workflows/scrape.yml`:

```yaml
name: Scrape and Enrich
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Allow manual trigger

    jobs:
      run-scripts:
        runs-on: ubuntu-latest
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          SERPER_API_KEY: ${{ secrets.SERPER_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install Dependencies
        run: |
          cd scraper/phase1_scraper && npm ci
          cd ../phase2_generator && npm ci
          npx playwright install chromium --with-deps
      - name: Run Scraper
        run: node scraper/phase1_scraper/scrapeBeyondChats.js
      - name: Run Enricher
        run: node scraper/phase2_generator/enrichArticles.js
```

---

## Option 2: The VPS Stack (Robust) 🖥️
*Best for full control and keeping everything in one place.*

**Prerequisites**: A VPS (DigitalOcean, Hetzner, AWS EC2) running Ubuntu.

1.  **PocketBase**:
    - Download the Linux binary to the VPS.
    - Run it with a systemd service (e.g., `pocketbase.service`) on port 8090.
    - Use Nginx/Caddy as a reverse proxy to serve it on a domain (e.g., `api.yourdomain.com`).

2.  **frontend**:
    - Build the React app locally (`npm run build`) or on the server.
    - Serve the `dist/` folder using Nginx/Caddy (e.g., `yourdomain.com`).

3.  **Automation**:
    - Clone the repo to the VPS.
    - Create a `cron` job (`crontab -e`) to run the scripts periodically:
      ```bash
      0 */6 * * * /usr/bin/node /path/to/scraper/phase1_scraper/scrapeBeyondChats.js >> /var/log/scraper.log 2>&1
      # ... (similar for phase 2)
      ```
