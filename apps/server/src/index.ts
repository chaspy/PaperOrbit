import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { prisma } from "@paperorbit/db";
import {
  SearchRequestSchema,
  SavePaperSchema,
  SummarizeSchema,
  type SearchRequest,
} from "@paperorbit/shared";
import {
  searchOpenAlex,
  normalizeOpenAlexWork,
  searchArxiv,
  normalizeArxivFeed,
  summarizeJa,
} from "@paperorbit/agent";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { embedText, cosineSim } from "@paperorbit/agent";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors({ 
  origin: ['http://localhost:5273', 'http://127.0.0.1:5273'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// POST /api/search
app.post("/api/search", async (req, res) => {
  try {
    const body = SearchRequestSchema.parse(req.body) as SearchRequest;
    const { q, filters } = body;
    
    console.log("[Search] Query:", q, "Filters:", filters);

    const oa = await searchOpenAlex(q, filters);
    const oaItems = Array.isArray(oa?.results) ? oa.results : [];

    // Always search arXiv as well
    let arxivRaw: any | undefined;
    try {
      const feed = await searchArxiv(q, filters?.limit ?? 20);
      arxivRaw = feed;
    } catch (err) {
      console.error("[arXiv search error]", err);
    }

    // snapshot
    await prisma.snapshot.create({
      data: {
        query: q,
        source: "search",
        filtersJson: JSON.stringify(filters ?? {}),
        resultIds: JSON.stringify({
          openalex: oaItems.map((x: any) => x?.id),
          arxiv: arxivRaw ? (Array.isArray(arxivRaw?.feed?.entry) ? arxivRaw.feed.entry.map((e: any)=> e?.id) : []) : [],
        }),
        rawJson: JSON.stringify({ openalex: oa, arxiv: arxivRaw }),
      },
    });

    res.json({ openalex: oa, arxiv: arxivRaw });
  } catch (err: any) {
    const status = err?.response?.status ?? 400;
    const msg = err?.message ?? "Bad Request";
    console.error("[Search Error]", status, msg, err?.response?.data || err);
    res.status(mapStatus(status)).json({ error: msg });
  }
});

// POST /api/save
app.post("/api/save", async (req, res) => {
  try {
    const { paper } = SavePaperSchema.parse(req.body);
    const data = {
      id: paper.id,
      source: paper.source,
      doi: paper.doi ?? null,
      arxivId: paper.arxivId ?? null,
      openAlexId: paper.openAlexId ?? null,
      title: paper.title,
      abstract: paper.abstract ?? null,
      year: paper.year ?? null,
      venue: paper.venue ?? null,
      url: paper.url ?? null,
      pdfUrl: paper.pdfUrl ?? null,
      topicsJson: JSON.stringify(paper.topics ?? []),
      authorsJson: JSON.stringify(paper.authors ?? []),
      referencesJson: JSON.stringify(paper.references ?? []),
    } as const;

    const saved = await prisma.paper.upsert({
      where: { id: paper.id },
      update: data,
      create: data,
    });
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
});

// POST /api/summarize/:paperId
app.post("/api/summarize/:paperId", async (req, res) => {
  try {
    const { paperId } = req.params;
    console.log("[Summarize] Paper ID:", paperId);
    
    const p = await prisma.paper.findUnique({ where: { id: decodeURIComponent(paperId) }, include: { pdfArtifacts: true } });
    if (!p) {
      console.log("[Summarize] Paper not found:", decodeURIComponent(paperId));
      return res.status(404).json({ error: "Paper not found" });
    }
    
    console.log("[Summarize] Found paper:", p.title);
    const pdfText = p.pdfArtifacts?.[0]?.text;
    const out = await summarizeJa({ title: p.title, abstract: p.abstract ?? undefined, pdfText });
    const text = [out.summary.background_problem, out.summary.method_results, out.summary.limitations_future].join("\n\n");
    await prisma.paper.update({ where: { id: p.id }, data: { summaryJa: text } });
    res.json(out);
  } catch (err: any) {
    console.error("[Summarize Error]", err);
    res.status(502).json({ error: err?.message ?? "Summarization failed" });
  }
});

// POST /api/pdf/:paperId
app.post("/api/pdf/:paperId", async (req, res) => {
  try {
    const { paperId } = req.params;
    console.log("[PDF Download] Paper ID:", paperId);
    
    const p = await prisma.paper.findUnique({ where: { id: decodeURIComponent(paperId) } });
    if (!p) {
      console.log("[PDF Download] Paper not found:", decodeURIComponent(paperId));
      return res.status(404).json({ error: "Paper not found" });
    }
    if (!p.pdfUrl) {
      console.log("[PDF Download] PDF URL missing for paper:", p.title);
      return res.status(400).json({ error: "pdfUrl missing" });
    }
    console.log("[PDF Download] Downloading PDF from:", p.pdfUrl);

    const dir = path.join(process.cwd(), "storage", "pdfs");
    fs.mkdirSync(dir, { recursive: true });
    // Use a safe filename
    const safeFileName = p.id.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfPath = path.join(dir, `${safeFileName}.pdf`);

    const resp = await axios.get(p.pdfUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(pdfPath, resp.data);

    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse") as (data: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(fs.readFileSync(pdfPath));
    const text = parsed.text || "";
    const chars = text.length;

    await prisma.pdfArtifact.create({ data: { paperId: p.id, path: pdfPath, text, chars } });
    res.json({ ok: true, chars, path: pdfPath });
  } catch (err: any) {
    console.error("[PDF Download Error]", err);
    res.status(502).json({ error: err?.message ?? "PDF parse failed" });
  }
});

// POST /api/embed/:paperId
app.post("/api/embed/:paperId", async (req, res) => {
  try {
    const { paperId } = req.params;
    const p = await prisma.paper.findUnique({ where: { id: decodeURIComponent(paperId) }, include: { pdfArtifacts: true } });
    if (!p) return res.status(404).json({ error: "Paper not found" });
    const text = [
      p.title,
      p.abstract ?? "",
      p.summaryJa ?? "",
      p.pdfArtifacts?.[0]?.text ? safeTrunc(p.pdfArtifacts[0].text, 6000) : "",
    ].filter(Boolean).join("\n\n");

    const { model, vector, dim } = await embedText(text);
    // store as Float32 bytes
    const f32 = new Float32Array(vector);
    const buf = Buffer.from(f32.buffer);
    await prisma.embedding.create({ data: { paperId: p.id, model, dim, vector: buf } });
    res.json({ ok: true, dim });
  } catch (err: any) {
    console.error("[Embedding Error]", err);
    res.status(502).json({ error: err?.message ?? "Embedding failed" });
  }
});

// GET /api/papers
app.get("/api/papers", async (_req, res) => {
  try {
    const papers = await prisma.paper.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(papers);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
});

// GET /api/papers/:id
app.get("/api/papers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await prisma.paper.findUnique({ where: { id } });
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json(paper);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
});

// POST /api/local-search
app.post("/api/local-search", async (req, res) => {
  try {
    const schema = z.object({ q: z.string().min(1), limit: z.number().int().min(1).max(50).optional() });
    const { q, limit } = schema.parse(req.body);
    const { vector: qVec } = await embedText(q);
    const embs = await prisma.embedding.findMany({ include: { paper: true } });
    const results = embs.map((e) => {
      const vec = bufferToFloat32(e.vector);
      const score = cosineSim(qVec, vec);
      return { paper: e.paper, score };
    }).sort((a,b)=> b.score - a.score).slice(0, limit ?? 20);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
});

function bufferToFloat32(buf: Buffer) {
  const arr = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  return Array.from(arr);
}

function safeTrunc(s: string, max: number) { return s.length > max ? s.slice(0, max) : s; }
function mapStatus(s: number) { return s >= 500 ? 502 : s; }
function tryParseJSON(s?: string | null) { if (!s) return null; try { return JSON.parse(s); } catch { return s; } }

const port = Number(process.env.PORT || 5175);
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
// Snapshots
app.get("/api/snapshots", async (_req, res) => {
  const list = await prisma.snapshot.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  res.json(list.map(s => ({ id: s.id, query: s.query, createdAt: s.createdAt })));
});

app.get("/api/snapshots/:id", async (req, res) => {
  const s = await prisma.snapshot.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json({
    id: s.id,
    query: s.query,
    filtersJson: tryParseJSON(s.filtersJson),
    resultIds: tryParseJSON(s.resultIds),
    rawJson: tryParseJSON(s.rawJson),
    createdAt: s.createdAt,
  });
});
});
