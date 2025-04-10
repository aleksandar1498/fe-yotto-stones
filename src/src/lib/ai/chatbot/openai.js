import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getEmbedding(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return embeddingResponse.data[0].embedding;
}

export async function createCompletion(language, prompt) {
  const systemPrompt = language === "bg"
    ? "Ти си любезен и полезен асистент на фирма за мрамор и гранит Yotto Stones."
    : "You are a friendly and helpful assistant for the marble and granite company Yotto Stones.";

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content.trim();
}
