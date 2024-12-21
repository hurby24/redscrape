export interface Job {
  title: string;
  url: string;
  hash: string;
  source: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  posted_at: string;
  ends_at: string | null;
}
