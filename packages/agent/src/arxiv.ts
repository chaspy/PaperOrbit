import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const ARXIV_API = "http://export.arxiv.org/api/query";

export async function searchArxiv(q: string, limit = 20) {
  const params = new URLSearchParams({
    search_query: `all:${q}`,
    start: "0",
    max_results: String(Math.min(limit, 100)),
    sortBy: "relevance",
  });
  const url = `${ARXIV_API}?${params.toString()}`;
  const res = await axios.get(url, { responseType: "text" });
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(res.data);
  return feed;
}

export function normalizeArxivFeed(feed: any) {
  const entries = Array.isArray(feed?.feed?.entry) ? feed.feed.entry : feed?.feed?.entry ? [feed.feed.entry] : [];
  return entries.map((e: any) => {
    const id: string = e?.id ?? "";
    const title: string = (e?.title ?? "").trim();
    const abstract: string = (e?.summary ?? "").trim();
    const published: string | undefined = e?.published;
    const year = published ? Number(String(published).slice(0,4)) : undefined;
    const authors = Array.isArray(e?.author) ? e.author.map((a: any) => a?.name).filter(Boolean) : e?.author?.name ? [e.author.name] : [];
    let pdfUrl: string | undefined;
    const links = Array.isArray(e?.link) ? e.link : e?.link ? [e.link] : [];
    for (const l of links) {
      if (l?.["@_title"] === "pdf" || l?.["@_type"] === "application/pdf") {
        pdfUrl = l?.["@_href"];
      }
    }
    const url = links.find((l: any)=> l?.["@_rel"] === "alternate")?.["@_href"] || id;
    const arxivId = id.split("/abs/")[1] || id;
    return {
      id,
      arxivId,
      source: "arxiv" as const,
      title,
      abstract,
      year,
      url,
      pdfUrl,
      authors,
    };
  });
}

