import { chromium } from "playwright";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import TurndownService from "turndown";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================
   ENV SETUP
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

/* =========================
   CONSTANTS
========================= */
const PB_URL = "http://127.0.0.1:8090";
const GOOGLE_SEARCH_URL = "https://www.google.com/search?q=";

const turndownService = new TurndownService();

/* =========================
   VALIDATION
========================= */
if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in .env.local");
    process.exit(1);
}
if (!process.env.SERPER_API_KEY) {
    console.error("SERPER_API_KEY is missing in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* =========================
   HELPERS
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
async function getArticlesToEnrich(token) {
    const res = await axios.get(
        `${PB_URL}/api/collections/articles/records`,
        {
            params: {
                filter: 'status = "original"',
                perPage: 5, // Process 5 at a time
            },
            headers: { Authorization: token },
        }
    );
    return res.data.items;
}

async function searchAndScrape(page, query) {
    console.log(`🔍 Searching Serper.dev for: "${query}"`);

    let links = [];
    try {
        const response = await axios.post(
            "https://google.serper.dev/search",
            {
                q: query,
                num: 5
            },
            {
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.organic) {
            links = response.data.organic.map(item => item.link);
        }
    } catch (error) {
        console.error(" Serper API failed:", error.message);
        return [];
    }

    // Filter relevant links
    links = links.filter(href => href && !href.includes("google.com") && !href.includes("youtube.com"));

    console.log(`Found links: ${links.join(", ")}`);

    const scrapedData = [];

    // Take top 2 and scrape content
    for (const link of links.slice(0, 2)) {
        try {
            console.log(`📄 Scraping reference: ${link}`);
            try {
                // Use a shorter timeout and continue on error
                await page.goto(link, { waitUntil: "domcontentloaded", timeout: 20000 });
            } catch (navErr) {
                console.warn(`   -> Navigation failed: ${navErr.message}, skipping.`);
                continue;
            }

            const content = await page.evaluate(() => {
                // Heuristic to find main content
                const article = document.querySelector("article") || document.querySelector("main") || document.body;
                // Remove scripts and styles
                const clone = article.cloneNode(true);
                clone.querySelectorAll("script, style, nav, footer, header").forEach(el => el.remove());
                return clone.innerText.substring(0, 15000).replace(/\s+/g, " ").trim();
            });

            if (content.length > 500) {
                // Turndown to Markdown for better LLM context
                const markdown = turndownService.turndown(content);
                scrapedData.push({ url: link, content: markdown });
                console.log(`   -> Extracted ${content.length} chars`);
            } else {
                console.log(`   -> Content too short (${content.length} chars), skipping.`);
            }
        } catch (err) {
            console.error(` Failed to scrape ${link}: ${err.message}`);
        }
    }

    return scrapedData;
}

async function generateEnhancedContent(originalTitle, originalContent, references) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    let prompt = `
You are an expert technical writer. Your task is to rewrite and enrich a blog post based on the ORIGINAL CONTENT and REFERENCE MATERIALS provided below.

RULES:
1.  Keep the tone professional yet engaging.
2.  Use Markdown formatting (H2, H3, bullet points).
3.  Synthesize information from the references to add depth, examples, or missing details to the original content.
4.  Do NOT plagiarize. Rewrite in your own words.
5.  At the very bottom, add a "References" section listing the reference URLs provided.

ORIGINAL TITLE: ${originalTitle}

ORIGINAL CONTENT:
${originalContent.substring(0, 5000)}

REFERENCE MATERIALS:
`;

    references.forEach((ref, i) => {
        prompt += `\n--- REFERENCE ${i + 1} (${ref.url}) ---\n${ref.content.substring(0, 5000)}\n`;
    });

    prompt += `\n\nProduce the complete, enhanced article now.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function updateArticle(token, articleId, newContent) {
    await axios.patch(
        `${PB_URL}/api/collections/articles/records/${articleId}`,
        {
            generated_content: newContent,
            status: "enriched",
        },
        {
            headers: { Authorization: token },
        }
    );
}

/* =========================
   MAIN
========================= */
async function run() {
    console.log("🚀 Starting verification & enrichment...");

    const token = await loginAdmin();
    console.log("✅ Authenticated");

    const articles = await getArticlesToEnrich(token);
    console.log(`Found ${articles.length} articles to enrich.`);

    if (articles.length === 0) {
        console.log("No 'original' status articles found. Exiting.");
        return;
    }

    const browser = await chromium.launch({ headless: false }); // Headless false for debugging/checking
    const page = await browser.newPage();

    for (const article of articles) {
        console.log(`\n-----------------------------------`);
        console.log(`Processing: ${article.title}`);

        try {
            // 1. Search & Scrape
            const references = await searchAndScrape(page, article.title);

            if (references.length === 0) {
                console.log("⚠️ No references found. Skipping enrichment for this run.");
                continue;
            }

            // 2. Generate
            console.log("🤖 Generating enhanced content with Gemini...");
            const enhancedContent = await generateEnhancedContent(
                article.title,
                article.original_content,
                references
            );

            // 3. Update
            console.log("💾 Updating PocketBase...");
            await updateArticle(token, article.id, enhancedContent);
            console.log("✅ Success!");

        } catch (err) {
            console.error(` Error processing article ${article.id}:`, err);
        }
    }

    await browser.close();
    console.log("\n🎉 All done.");
}

run();
