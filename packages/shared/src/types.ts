export type NormalizedOpenAlexWork = {
  id: string;
  title: string;
  abstract?: string;
  doi?: string;
  year?: number;
  venue?: string;
  url?: string;
  pdfUrl?: string;
  topics?: any[];
  authors?: any[];
  referenced_works?: string[];
  source: "openalex";
  openAlexId?: string;
};

export type NormalizedArxivEntry = {
  id: string;
  title: string;
  abstract?: string;
  year?: number;
  url?: string;
  pdfUrl?: string;
  authors?: string[];
  source: "arxiv";
  arxivId?: string;
};

export type SearchResultPayload = {
  openalex?: unknown;
  arxiv?: unknown;
};

