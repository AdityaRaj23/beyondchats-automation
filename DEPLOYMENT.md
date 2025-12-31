# Deployment Guide

This project consists of three parts that need to be deployed:
1.  **Backend**: PocketBase (Database & API)
2.  **Frontend**: React + Vite (User Interface)
3.  **Automation**: Node.js Scripts (Scraper & Enricher)

Here are two recommended ways to deploy this stack.

---

## Option 1: The "Serverless" Stack (Free/Easy) ☁️
*Best for getting started quickly with minimal cost.*

### 1. Backend: PocketHost.io (or Fly.io)
[PocketHost](https://pockethost.io/) is a managed service for PocketBase.
1.  Go to [pockethost.io](https://pockethost.io/) and create a new instance.
2.  You will get a URL like `https://beyondchats-demo.pockethost.io`.
3.  Go to the Admin UI (`/_/`) and set up your `articles` collection (Import your local schema if possible, or recreate the fields: `title`, `slug`, `original_content`, `generated_content`, `source_url`, `status`).

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
      PB_URL: "https://beyondchats-demo.pockethost.io" # Your production DB
      PB_ADMIN_EMAIL: ${{ secrets.PB_ADMIN_EMAIL }}
      PB_ADMIN_PASSWORD: ${{ secrets.PB_ADMIN_PASSWORD }}
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
