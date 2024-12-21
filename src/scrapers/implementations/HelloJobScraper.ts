import { HTMLScraper } from "../base/HTMLScraper.ts";
import type { Job } from "../../models/Jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class HelloJobScraper extends HTMLScraper {
  initialize(): void {
    this.router.addDefaultHandler(async ({ enqueueLinks, log }) => {
      log.info("enqueueing HelloJobs URLs");
      await enqueueLinks({
        selector: ".vacancies__item",
        globs: ["https://www.hellojob.az/vakansiya/**"],
        label: "HelloJob/detail",
      });
    });
  }

  handleDetailPage(): void {
    this.router.addHandler("HelloJob/detail", async ({ request, $, log }) => {
      const title = $(".resume__header__name").first().text().trim();
      const company =
        $(".resume__header__speciality a")
          .first()
          .text()
          .trim()
          .toLowerCase() || null;
      const url = request.loadedUrl;
      let posted_at = $(".resume__item__text:contains('Elan tarixi') h4")
        .first()
        .text()
        .trim();
      let ends_at =
        $(".resume__item__text:contains('Bitmə tarixi') h4")
          .first()
          .text()
          .trim() || null;
      posted_at = this.DateToTimestamp(
        `${posted_at} ${new Date().getFullYear()}`
      );

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
        source: "HelloJob",
        company,
        location:
          $(".resume__item:contains('Şəhər') .resume__item__text h4 a")
            .first()
            .text()
            .trim() || null,
        salary: $(".vacancies__price").first().text().trim() || null,
        posted_at,
        ends_at,
      };

      this.jobs.push(job);
    });
  }

  DateToTimestamp(date: string): string {
    const formattedDate = moment(date, "DD MMMM YYYY", "az");
    return formattedDate.toISOString();
  }
}
