import { chromium } from "playwright";
import axios from "axios";
import slugify from "slugify";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import TurndownService from "turndown";

/* =========================
   ENV SETUP (ESM SAFE)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

/* =========================
   CONSTANTS
========================= */
const PB_URL = "http://127.0.0.1:8090";
const LISTING_URL = "https://beyondchats.com/blogs/page/14/";
const BASE_URL = "https://beyondchats.com";

const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
});


/* =========================
   LOGIN TO POCKETBASE
========================= */
async function loginAdmin() {
    const email = process.env.PB_ADMIN_EMAIL;
    const password = process.env.PB_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("Missing PocketBase admin credentials");
    }

    const res = await axios.post(
        `${PB_URL}/api/collections/_superusers/auth-with-password`,
        { identity: email, password }
    );

    return res.data.token;
}

/* =========================
   SCRAPE BLOG LISTING
========================= */
async function fetchBlogLinks(page) {
    await page.goto(LISTING_URL, {
        waitUntil: "networkidle",
        timeout: 60000,
    });

    await page.waitForSelector("article.entry-card");

    const links = await page.evaluate(() => {
        return Array.from(
            document.querySelectorAll(
                "article.entry-card .entry-title a"
            )
        ).map(a => a.href);
    });

    return [...new Set(links)];
}

/* =========================
   SCRAPE FULL BLOG CONTENT
========================= */
async function scrapeBlog(page, url) {
    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
    });

    // ✅ Exact content container
    await page.waitForSelector(
        "#content .elementor-widget-theme-post-content",
        { timeout: 30000 }
    );

    // Scroll once for lazy-loaded content
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1500);

    // =========================
    // BROWSER CONTEXT
    // =========================
    const article = await page.evaluate(() => {
        const title =
            document.querySelector("h1")?.innerText?.trim();

        const root = document.querySelector(
            "#content .elementor-widget-theme-post-content"
        );

        if (!root) {
            return {
                title,
                text: "",
                html: "",
            };
        }

        const blocks = [];

        root.querySelectorAll("h2, h3, h4, p, li").forEach(el => {

            if (
                el.closest(".has-social-placeholder") ||
                el.closest(".wp-applause-container") ||
                el.closest(".elementor-share-buttons")
            ) {
                return;
            }

            const text = el.innerText
                .replace(/\s+/g, " ")
                .trim();

            if (text.length > 30) {
                blocks.push(text);
            }
        });

        return {
            title,
            text: blocks.join("\n\n"),
            html: root.innerHTML, // ✅ RAW HTML
        };
    });

    // =========================
    // VALIDATION
    // =========================
    if (!article.text || article.text.length < 500) {
        throw new Error("Content extraction failed (too short)");
    }

    // =========================
    // HTML → MARKDOWN (NODE)
    // =========================
    const markdownContent = turndownService.turndown(article.html);

    // =========================
    // FINAL OBJECT
    // =========================
    return {
        title: article.title,
        slug: slugify(article.title, {
            lower: true,
            strict: true,
        }),

        // Plain text (LLM / search)
        original_content: article.text,

        // Raw HTML (rendering)
        html_content: article.html,

        // Markdown (editing / LLM)
        markdown_content: markdownContent,


        source_url: url,
        status: "original",
    };
}



/* =========================
   SAVE TO POCKETBASE
========================= */
async function saveArticle(token, article) {
    await axios.post(
        `${PB_URL}/api/collections/articles/records`,
        article,
        {
            headers: { Authorization: token },
        }
    );
}

/* =========================
   MAIN RUNNER
========================= */
async function run() {
    console.log("🚀 Starting scraper");

    const token = await loginAdmin();
    console.log("✅ PocketBase authenticated");

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
    });

    console.log("🔍 Fetching blog links...");
    const links = await fetchBlogLinks(page);
    console.log(`✅ Found ${links.length} blogs`);

    const selected = links.slice(0, 5); // oldest 5

    for (const url of selected) {
        try {
            console.log(`📄 Scraping ${url}`);
            const article = await scrapeBlog(page, url);

            console.log(
                `📝 Content length: ${article.original_content.length}`
            );

            await saveArticle(token, article);
            console.log(`✅ Saved: ${article.title}`);
        } catch (err) {
            console.error(`❌ Failed for ${url}:`, err.message);
        }
    }

    await browser.close();
    console.log("🎉 Done");
}

run().catch(err => {
    console.error("🔥 Fatal Error:", err);
});
