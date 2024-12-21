import {
  BusyAzScraper,
  BossAzScraper,
  HelloJobScraper,
  JobSearchScraper,
} from "./implementations/index.ts";
import type { HTMLScraperOptions, HTMLScraper } from "./base/HTMLScraper.js";
import type { APIScraper, APIScraperOptions } from "./base/APIScraper.ts";
import { ProxyConfiguration } from "crawlee";
import dotenv from "dotenv";

dotenv.config();

class ScraperManager {
  private HTMLScrapers: HTMLScraper[] = [];
  private APIScrapers: APIScraper[] = [];

  constructor() {
    const APIproxyConfiguration =
      process.env.PROXY_URLS?.split(",").map((url) => {
        const [authAndHost, port] = url.split("@")[1].split(":");
        const [username, password] = url
          .split("//")[1]
          .split("@")[0]
          .split(":");
        const host = authAndHost;

        return {
          protocol: "http",
          host,
          port: parseInt(port, 10),
          auth: { username, password },
        };
      }) || [];
    const proxyConfiguration = new ProxyConfiguration({
      proxyUrls: process.env.PROXY_URLS?.split(","),
    });

    const helloJobOptions: HTMLScraperOptions = {
      startUrls: [
        "https://www.hellojob.az/vakansiyalar?page=1",
        "https://www.hellojob.az/vakansiyalar?page=2",
      ],
      proxyConfiguration,
      maxRequestsPerCrawl: 50,
    };
    const busyAzOptions: HTMLScraperOptions = {
      startUrls: [
        "https://busy.az/vacancies?page=1",
        "https://busy.az/vacancies?page=2",
      ],
      proxyConfiguration,
      maxRequestsPerCrawl: 50,
    };

    const bossAzOptions: HTMLScraperOptions = {
      startUrls: [
        "https://boss.az/vacancies?page=1",
        "https://boss.az/vacancies?page=2",
        "https://boss.az/vacancies?page=3",
      ],
      proxyConfiguration,
      maxRequestsPerCrawl: 50,
    };

    const jobSearchOptions: APIScraperOptions = {
      baseUrl: "https://www.jobsearch.az/api-en",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      proxyConfiguration: APIproxyConfiguration,
    };

    this.HTMLScrapers.push(new HelloJobScraper(helloJobOptions));
    this.HTMLScrapers.push(new BusyAzScraper(busyAzOptions));
    this.HTMLScrapers.push(new BossAzScraper(bossAzOptions));
    this.APIScrapers.push(new JobSearchScraper(jobSearchOptions));
  }

  async runAll(): Promise<void> {
    for (const scraper of this.HTMLScrapers) {
      scraper.initialize();
      scraper.handleDetailPage();
      await scraper.run();
      await scraper.saveJobs();
    }
    for (const scraper of this.APIScrapers) {
      await scraper.fetchData("/vacancies-en");
      await scraper.saveJobs();
    }
  }
}

export default ScraperManager;
