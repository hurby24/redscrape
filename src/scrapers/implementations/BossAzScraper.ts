import { HTMLScraper } from "../base/HTMLScraper.ts";
import type { Job } from "../../models/Jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class BossAzScraper extends HTMLScraper {
  initialize(): void {
    this.router.addDefaultHandler(async ({ enqueueLinks, log }) => {
      log.info("enqueueing BossAz URLs");
      await enqueueLinks({
        selector: ".results-i-link",
        globs: ["https://boss.az/vacancies/**"],
        label: "Boss/detail",
      });
    });
  }

  handleDetailPage(): void {
    this.router.addHandler("Boss/detail", async ({ request, $, log }) => {
      const title = $(".post-title").first().text().trim().toLowerCase();
      const company = $(".post-company").first().text().trim() || null;
      const url = request.loadedUrl;

      let posted_at = $(".bumped_on.params-i-val").first().text().trim();
      let ends_at = $(".expires_on.params-i-val").first().text().trim() || null;

      posted_at = this.DateToTimestamp(posted_at);

      if (ends_at) {
        ends_at = this.DateToTimestamp(ends_at);
      }
      const postedAtMoment = moment(posted_at);
      const now = moment();
      const isRecentJob = now.diff(postedAtMoment, "days") <= 2;
      if (!isRecentJob) {
        return;
      }

      log.info(`${title}`, { url });

      const job: Job = {
        title,
        url,
        hash: crypto
          .createHash("sha256")
          .update(`${title}.${company}`)
          .digest("hex"),
        source: "BossAz",
        company,
        location: $(".region.params-i-val").first().text().trim() || null,
        salary: $(".post-salary.salary").first().text().trim() || null,
        posted_at,
        ends_at,
      };

      this.jobs.push(job);
    });
  }

  DateToTimestamp(date: string): string {
    const formattedDate = moment(date, "MMMM DD, YYYY", "az");
    return formattedDate.toISOString();
  }
}
