import { HTMLScraper } from "../base/HTMLScraper.ts";
import type { Job } from "../../models/Jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class BusyAzScraper extends HTMLScraper {
  initialize(): void {
    this.router.addDefaultHandler(async ({ enqueueLinks, log }) => {
      log.info("enqueueing BusyAz URLs");
      await enqueueLinks({
        selector: ".job-listing",
        globs: ["https://busy.az/vacancy/**"],
        label: "Busy/detail",
      });
    });
  }

  handleDetailPage(): void {
    this.router.addHandler("Busy/detail", async ({ request, $, log }) => {
      const title = $(".header-details h1").first().text().trim().toLowerCase();
      const company = $(".header-details li a").first().text().trim() || null;
      const url = request.loadedUrl;

      let posted_at = $(
        ".job-overview-inner li:contains('Elanın qoyulma tarixi') h5"
      )
        .text()
        .trim();
      let ends_at =
        $(".job-overview-inner li:contains('Son müraciət tarixi') h5")
          .text()
          .trim() || null;

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
        source: "BusyAz",
        company,
        location:
          $(".job-overview-inner li:contains('Yer') h5")
            .first()
            .text()
            .trim() || null,
        salary:
          $(".job-overview-inner li:contains('Maaş') h5")
            .first()
            .text()
            .trim() || null,
        posted_at,
        ends_at,
      };

      this.jobs.push(job);
    });
  }

  DateToTimestamp(date: string): string {
    const formattedDate = moment(date, "DD.MM.YYYY", "az");
    return formattedDate.toISOString();
  }
}
