import axios, { AxiosInstance, type AxiosProxyConfig } from "axios";
import { createDbClient } from "../../db/CreateDbClient.ts";
import type { Job } from "../../models/Jobs.ts";

export abstract class APIScraper {
  protected client: AxiosInstance;
  protected jobs: Job[] = [];
  protected proxyConfiguration: AxiosProxyConfig[];

  constructor(options: APIScraperOptions) {
    this.proxyConfiguration = options.proxyConfiguration;
    this.client = axios.create({
      baseURL: options.baseUrl,
      headers: options.headers,
      timeout: options.timeout || 10000,
    });
  }

  abstract fetchData(endpoint: string): Promise<void>;
  abstract dateToTimestamp(date: string): string;

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

  protected async get(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<any> {
    try {
      let random_index = Math.floor(
        Math.random() * this.proxyConfiguration.length
      );
      const response = await this.client.get(endpoint, {
        params,
        proxy: this.proxyConfiguration[random_index],
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      throw error;
    }
  }
}

export interface APIScraperOptions {
  baseUrl: string;
  proxyConfiguration: AxiosProxyConfig[];
  headers?: Record<string, string>;
  timeout?: number;
}
