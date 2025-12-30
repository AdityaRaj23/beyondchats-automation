import axios from "axios";
import * as cheerio from "cheerio";
import slugify from "slugify";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/* ================================
   ENV SETUP (ESM SAFE)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

/* ================================
   CONSTANTS
================================ */
const PB_URL = "http://127.0.0.1:8090";
const BASE_URL = "https://beyondchats.com";
const LISTING_URL = "https://beyondchats.com/blogs/page/14/";

/* ================================
   AUTHENTICATE POCKETBASE
================================ */
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

/* ================================
   SCRAPE BLOG LISTING PAGE
================================ */
async function fetchBlogLinks() {
    const { data } = await axios.get(LISTING_URL);
    const $ = cheerio.load(data);

    const links = [];

    $("article.entry-card .entry-title a").each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
            links.push(href.startsWith("http") ? href : `${BASE_URL}${href}`);
        }
    });

    return [...new Set(links)]; // remove duplicates
}

async function scrapeBlogPage(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
        },
    });

    const $ = cheerio.load(data);

    /* --------------------
       METADATA (works already)
    -------------------- */

    const title =
        $("h1.entry-title").first().text().trim() ||
        $('meta[property="og:title"]').attr("content");

    const author =
        $('meta[name="twitter:data1"]').attr("content") ||
        $("a[rel='author']").first().text().trim();

    const published_at =
        $('meta[property="article:published_time"]').attr("content");

    const image =
        $('meta[property="og:image"]').attr("content");

    const canonical =
        $('link[rel="canonical"]').attr("href") || url;

    const tags = [];
    $('meta[property="article:tag"]').each((_, el) => {
        tags.push($(el).attr("content"));
    });

    /* --------------------
       ✅ FIXED CONTENT EXTRACTION
    -------------------- */

    let finalContent = "";

    // STEP 1: Get raw HTML of article body
    const rawHtml =
        $(".entry-content").html() ||
        $("article").html();

    if (!rawHtml) {
        throw new Error("Article HTML not found");
    }

    // STEP 2: Parse raw HTML separately
    const $$ = cheerio.load(rawHtml);

    // STEP 3: Remove junk
    $$(
        "script, style, nav, footer, aside, iframe, .ct-share-box, .elementor-widget-divider"
    ).remove();

    // STEP 4: Collect real readable content
    const chunks = [];

    $$("h2, h3, h4, p, li").each((_, el) => {
        const text = $$(el)
            .text()
            .replace(/\s+/g, " ")
            .trim();

        if (text.length > 30) {
            chunks.push(text);
        }
    });

    finalContent = chunks.join("\n\n");

    /* --------------------
       HARD FALLBACK (SEO meta)
    -------------------- */

    if (finalContent.length < 200) {
        const metaDesc = $('meta[name="description"]').attr("content");
        if (metaDesc) {
            finalContent = metaDesc;
        }
    }

    if (!finalContent || finalContent.length < 100) {
        throw new Error("Content extraction failed");
    }

    return {
        title,
        slug: slugify(title, { lower: true, strict: true }),
        original_content: finalContent,
        author,
        published_at,
        tags,
        image,
        source_url: canonical,
        status: "original",
    };
}



/* ================================
   SAVE TO POCKETBASE
================================ */
async function saveArticle(token, article) {
    await axios.post(
        `${PB_URL}/api/collections/articles/records`,
        article,
        {
            headers: {
                Authorization: token,
            },
        }
    );
}

/* ================================
   MAIN RUNNER
================================ */
async function run() {
    try {
        console.log("🔐 Logging into PocketBase...");
        const token = await loginAdmin();
        console.log("✅ Authenticated");

        console.log("🔍 Fetching blog links...");
        const links = await fetchBlogLinks();
        console.log(`✅ Found ${links.length} articles`);

        // Only scrape first 5 (oldest on page)
        const selected = links.slice(0, 5);

        for (const url of selected) {
            try {
                console.log(`📄 Scraping ${url}`);
                const article = await scrapeBlogPage(url);
                await saveArticle(token, article);
                console.log(`✅ Saved: ${article.title}`);
            } catch (err) {
                console.error(`❌ Failed for ${url}`, err.message);
            }
        }

        console.log("🎉 All done.");
    } catch (err) {
        console.error("🔥 Fatal Error:", err.message);
    }
}

run();
