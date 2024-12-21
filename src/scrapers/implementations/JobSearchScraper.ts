import { APIScraper } from "../base/APIScraper.ts";
import type { Job } from "../../models/Jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class JobSearchScraper extends APIScraper {
  async fetchData(endpoint: string): Promise<void> {
    try {
      const response = await this.get(endpoint);

      const jobs: Job[] = response.items.map((item: any) => {
        const title = item.title;
        const company = item.company?.title || null;
        const location = item.company?.address || null;
        const salary = item.salary > 0 ? `${item.salary} AZN` : null;

        return {
          title,
          url: `https://www.jobsearch.az/vacancies/${item.slug}`,
          hash: crypto
            .createHash("sha256")
            .update(`${title}.${company}`)
            .digest("hex"),
          source: "JobSearch.az",
          company,
          location,
          salary,
          posted_at: this.dateToTimestamp(item.created_at),
          ends_at: item.deadline_at
            ? this.dateToTimestamp(item.deadline_at)
            : null,
        };
      });

      this.jobs = jobs;
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  }
  dateToTimestamp(date: string): string {
    return moment(date).toISOString();
  }
}
