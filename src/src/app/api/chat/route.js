import { supabase } from "@/lib/ai/chatbot/supabase";
import { getEmbedding, createCompletion } from "@/lib/ai/chatbot/openai"; 
import { searchSupabase } from "@/lib/ai/chatbot/supabase";
import { getGlobalFacts, embedGlobalFactsCache, getMaxSimilarityScore } from "@/lib/ai/chatbot/utils";

export async function POST(req) {
  try {
    const { message, language } = await req.json();

    // ✅ Step 1: Prepare global facts embeddings (cached)
    await embedGlobalFactsCache(language);

    // ✅ Step 2: Embed user query
    const queryEmbedding = await getEmbedding(message);

    // ✅ Step 3: Similarity check with global facts
    const maxSimilarity = getMaxSimilarityScore(queryEmbedding);
    console.log(maxSimilarity);

    const similarityThreshold = 0.75;
    const isWeakContext = maxSimilarity < similarityThreshold;

    // ✅ Step 4: Search Supabase vector store
    const matches = await searchSupabase(queryEmbedding);
    const contextText = matches.map(match => match.text).join("\n\n");
    const globalFactsText = getGlobalFacts(language);

    // ✅ Step 5: Build final context
    const fullContext = [
      globalFactsText ? `Global Knowledge:\n${globalFactsText}` : "",
      contextText ? `Retrieved from website:\n${contextText}` : "",
    ].filter(Boolean).join("\n\n");

    // ✅ Step 6: Log if weak context
    if (isWeakContext) {
      await supabase.from("chatbot_feedback").insert([{
        question: message,
        language,
        context_used: contextText,
        global_facts_used: globalFactsText,
        similarity_score: maxSimilarity,
      }]);
    }

    // ✅ Step 7: Prepare prompt dynamically
    const prompt =
      language === "bg"
        ? `Ти си експерт по каменни материали за Yotto Stones и винаги препоръчваш най-доброто решение според цената, качеството и нуждите на клиента.
Използвай информацията от уебсайта, за да отговориш на въпроса на потребителя на български език.
Ако липсва информация в сайта, използвай знанията си като експерт по камък, архитект и дизайнер, за да дадеш професионален отговор.
Може да разглеждаш и да използваш информация от нашата обява https://www.olx.bg/d/ad/podprozorechni-pervazi-shapki-pragove-ot-estestven-kamak-ot-18lv-l-m-CID262-ID9AgvP.html , но не я копирай директно.
Не включвай информация за други компании или материали извън Yotto Stones. Не прекалявай с дължината на отговора.
Контекст:
${fullContext}

Въпрос на потребителя: ${message}
Отговори:`
        : `You are an expert in stone materials for Yotto Stones and always recommend the best option based on price, quality, and the client's needs.
Using the information from the website, answer the user's question in English.
If the information is not available on the site, use your expertise as a stone expert, architect, and designer to provide an answer.
You can also use information from our ad https://www.olx.bg/d/ad/podprozorechni-pervazi-shapki-pragove-ot-estestven-kamak-ot-18lv-l-m-CID262-ID9AgvP.html, but do not copy it directly.
Do not include information about other companies or materials outside of Yotto Stones. Do not overdo the length of the answer.
Context:
${fullContext}

User's question: ${message}
Answer:`;

    // ✅ Step 8: Get completion
    const answer = await createCompletion(language, prompt);

    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
