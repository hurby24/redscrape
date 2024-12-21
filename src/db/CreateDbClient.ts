import { createClient } from "@supabase/supabase-js";

export const createDbClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
  }
  return createClient(supabaseUrl, supabaseKey);
};
