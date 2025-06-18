import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function searchSupabase(embedding) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 5,
  });

  if (error) {
    console.error("Supabase search error:", error);
    throw error;
  }

  return data;
}

