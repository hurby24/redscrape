import {
  CheerioCrawler,
  createCheerioRouter,
  type ProxyConfiguration,
  RequestQueue,
} from "crawlee";
import crypto from "node:crypto";
import { createDbClient } from "../../db/CreateDbClient.ts";
import type { Job } from "../../models/Jobs.ts";

export abstract class HTMLScraper {
  protected router: ReturnType<typeof createCheerioRouter>;
  protected requestQueue!: RequestQueue;
  protected crawler!: CheerioCrawler;
  protected jobs: Job[] = [];
  public startUrls: string[] = [];
  public options: ScraperOptions;

  constructor(options: ScraperOptions) {
    this.router = createCheerioRouter();
    this.options = options;
    this.startUrls = options.startUrls;
  }

  public async run(): Promise<void> {
    this.requestQueue = await RequestQueue.open(
      crypto.randomBytes(12).toString("hex")
    );
    this.crawler = new CheerioCrawler({
      proxyConfiguration: this.options.proxyConfiguration,
      requestHandler: this.router,
      maxRequestsPerCrawl: this.options.maxRequestsPerCrawl,
      maxRequestRetries: 2,
      maxRequestsPerMinute: 60,
      requestQueue: this.requestQueue,
    });
    await this.crawler.run(this.startUrls);
    this.requestQueue.drop();
  }

  abstract initialize(): void;
  abstract handleDetailPage(): void;
  abstract DateToTimestamp(date: string): string;

  async saveJobs(): Promise<void> {
    const db = createDbClient();
    try {
      const { data, error } = await db.from("Jobs").upsert(this.jobs, {
        onConflict: "hash",
        ignoreDuplicates: true,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export interface ScraperOptions {
  startUrls: string[];
  proxyConfiguration: ProxyConfiguration;
  maxRequestsPerCrawl: number;
}
