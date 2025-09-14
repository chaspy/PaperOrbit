import OpenAI from "openai";

export async function embedText(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
  const model = "text-embedding-3-small";
  const res = await openai.embeddings.create({ model, input: text });
  const vec = res.data?.[0]?.embedding;
  if (!vec) throw new Error("No embedding returned");
  return { model, vector: vec, dim: vec.length };
}

export function cosineSim(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i=0;i<n;i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

