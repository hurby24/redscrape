import ScraperManager from "./scrapers/ScraperManager.ts";

const scraperManager = new ScraperManager();
await scraperManager.runAll();
