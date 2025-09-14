import OpenAI from "openai";
import { SummarizeSchema } from "@paperorbit/shared";
import { zodToJsonSchema } from "zod-to-json-schema";

export async function summarizeJa(input: { title: string; abstract?: string; pdfText?: string }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });

  const schema = SummarizeSchema;
  const text = [
    `タイトル: ${input.title}`,
    input.abstract ? `要旨: ${input.abstract}` : undefined,
    input.pdfText ? `本文（抜粋）: ${truncate(input.pdfText, 8000)}` : undefined,
  ].filter(Boolean).join("\n\n");

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "あなたは研究論文の要約者です。出力は日本語で3段落、指定スキーマに厳密に従ってください。",
      },
      {
        role: "user",
        content: `以下の論文情報を3段落で要約してください。\n${text}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "summary_schema",
        schema: zodToJsonSchema(schema) as any,
        strict: true,
      },
    },
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error("No response content");
  const parsed = JSON.parse(content);
  const result = SummarizeSchema.parse(parsed);
  return result;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) : s;
}
