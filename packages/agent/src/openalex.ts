import axios from "axios";
import type { SearchFilters } from "@paperorbit/shared";

const OPENALEX_BASE = "https://api.openalex.org";

export async function searchOpenAlex(q: string, filters?: SearchFilters) {
  const params: Record<string, any> = {
    search: q,
    per_page: Math.min(filters?.limit ?? 20, 200),
    sort: "relevance_score:desc",
  };
  
  // Build filter parameter
  const filterParts: string[] = [];
  
  // year filters map to publication_date
  if (filters?.yearMin) filterParts.push(`from_publication_date:${filters.yearMin}-01-01`);
  if (filters?.yearMax) filterParts.push(`to_publication_date:${filters.yearMax}-12-31`);
  if (typeof filters?.openAccess === "boolean") filterParts.push(`is_oa:${filters.openAccess}`);
  
  if (filterParts.length > 0) {
    params.filter = filterParts.join(',');
  }

  const url = `${OPENALEX_BASE}/works`;
  const res = await axios.get(url, { params });
  return res.data;
}

export function normalizeOpenAlexWork(w: any) {
  const id = String(w?.id ?? w?.ids?.openalex ?? "");
  const doi = w?.doi ?? w?.ids?.doi ?? undefined;
  const title = w?.title ?? "";
  const url = w?.primary_location?.source?.homepage_url || w?.primary_location?.landing_page_url || w?.alternate_host_venues?.[0]?.url || undefined;
  const pdfUrl = w?.primary_location?.pdf_url || undefined;
  const year = w?.publication_year ?? (w?.publication_date ? Number(String(w.publication_date).slice(0,4)) : undefined);
  const venue = w?.primary_location?.source?.display_name || w?.host_venue?.display_name || undefined;
  const topics = w?.topics ?? [];
  const authors = (w?.authorships ?? []).map((a: any) => ({
    author: a?.author?.display_name, id: a?.author?.id,
  }));
  const referenced_works = w?.referenced_works ?? [];

  return {
    id,
    openAlexId: id,
    source: "openalex" as const,
    title,
    abstract: w?.abstract_inverted_index ? invertOpenAlexAbstract(w.abstract_inverted_index) : w?.abstract,
    doi,
    url,
    pdfUrl,
    year,
    venue,
    topics,
    authors,
    referenced_works,
  };
}

function invertOpenAlexAbstract(idx: Record<string, number[]>) {
  // Convert inverted index to text
  const positions: [number, string][] = [];
  for (const [word, inds] of Object.entries(idx)) {
    for (const i of inds) positions.push([i, word]);
  }
  positions.sort((a,b)=>a[0]-b[0]);
  return positions.map(([,w])=>w).join(" ");
}
