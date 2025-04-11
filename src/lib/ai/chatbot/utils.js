import { globalFacts } from "@/data/globalFacts";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let globalFactsCache = [];

export async function embedGlobalFactsCache(language) {
  if (globalFactsCache.length > 0) return;

  const texts = globalFacts.map((fact) => fact[language] || fact["en"]);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  globalFactsCache = response.data.map((item, index) => ({
    embedding: item.embedding,
    text: texts[index],
  }));
}

export function getRelevantGlobalFacts(
  queryEmbedding,
  language,
  threshold = 0.75,
  maxFacts = 5
) {
  const texts = globalFacts.map((fact) => fact[language] || fact["en"]);

  const scoredFacts = globalFactsCache.map((fact, index) => ({
    similarity: cosineSimilarity(queryEmbedding, fact.embedding),
    text: texts[index],
  }));

  return scoredFacts
    .filter((fact) => fact.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxFacts)
    .map((fact) => fact.text)
    .join("\n");
}

export function getGlobalFacts(language) {
  return globalFacts.map((fact) => fact[language] || fact["en"]).join("\n");
}

export function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export function getMaxSimilarityScore(queryEmbedding) {
  return Math.max(
    ...globalFactsCache.map((fact) =>
      cosineSimilarity(queryEmbedding, fact.embedding)
    )
  );
}

export function getAverageSimilarity(matches) {
  if (!matches.length) return 0;
  const totalScore = matches.reduce((acc, match) => acc + match.similarity, 0);
  return totalScore / matches.length;
}
