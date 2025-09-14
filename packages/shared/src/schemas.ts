import { z } from "zod";

export const SearchFiltersSchema = z
  .object({
    yearMin: z.number().int().optional(),
    yearMax: z.number().int().optional(),
    openAccess: z.boolean().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .strict();

export const SummarizeSchema = z
  .object({
    summary: z.object({
      background_problem: z.string(),
      method_results: z.string(),
      limitations_future: z.string(),
    }),
  })
  .strict();

export const SavePaperSchema = z
  .object({
    paper: z.object({
      id: z.string(),
      source: z.enum(["openalex", "arxiv", "crossref", "manual"]).default("manual"),
      doi: z.string().optional(),
      arxivId: z.string().optional(),
      openAlexId: z.string().optional(),
      title: z.string(),
      abstract: z.string().optional(),
      year: z.number().int().optional(),
      venue: z.string().optional(),
      url: z.string().url().optional(),
      pdfUrl: z.string().url().optional(),
      topics: z.array(z.any()).optional(),
      authors: z.array(z.any()).optional(),
      references: z.array(z.string()).optional(),
    }),
  })
  .strict();

export const SearchRequestSchema = z
  .object({
    q: z.string().min(1),
    filters: SearchFiltersSchema.optional(),
  })
  .strict();

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SummarizeOutput = z.infer<typeof SummarizeSchema>;
export type SavePaperInput = z.infer<typeof SavePaperSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

