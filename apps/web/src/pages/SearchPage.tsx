import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export function SearchPage() {
  const [q, setQ] = useState("LLM agent planning");
  const [openAccess, setOpenAccess] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSearch() {
    setLoading(true);
    try {
      const res = await api.post("/api/search", { q, filters: { openAccess, limit: 20 } });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveOpenAlex(item: any) {
    const w = item;
    const norm = normalizeOpenAlex(w);
    const res = await api.post("/api/save", { paper: norm });
    alert("saved: " + res.data.id);
  }

  async function onSaveArxiv(item: any) {
    const norm = normalizeArxiv(item);
    const res = await api.post("/api/save", { paper: norm });
    alert("saved: " + res.data.id);
  }

  function normalizeOpenAlex(w: any) {
    const id = String(w?.id ?? w?.ids?.openalex ?? "");
    const doi = w?.doi ?? w?.ids?.doi ?? undefined;
    const title = w?.title ?? "";
    const url = w?.primary_location?.source?.homepage_url || w?.primary_location?.landing_page_url || undefined;
    const pdfUrl = w?.primary_location?.pdf_url || undefined;
    const year = w?.publication_year ?? (w?.publication_date ? Number(String(w.publication_date).slice(0,4)) : undefined);
    const venue = w?.primary_location?.source?.display_name || w?.host_venue?.display_name || undefined;
    const topics = w?.topics ?? [];
    const authors = (w?.authorships ?? []).map((a: any) => ({ author: a?.author?.display_name, id: a?.author?.id }));
    const references = w?.referenced_works ?? [];
    
    // Filter out undefined values
    const paper: any = { id, source: "openalex", openAlexId: id, title, topics, authors, references };
    if (doi !== undefined) paper.doi = doi;
    if (year !== undefined) paper.year = year;
    if (venue !== undefined) paper.venue = venue;
    if (url !== undefined) paper.url = url;
    if (pdfUrl !== undefined) paper.pdfUrl = pdfUrl;
    
    return paper;
  }

  function normalizeArxiv(e: any) {
    const id = String(e?.id ?? "");
    const title = String(e?.title ?? "");
    // Extract PDF URL from link array
    const pdfLink = Array.isArray(e?.link) 
      ? e.link.find((l: any) => l?.["@_type"] === "application/pdf")?.["@_href"]
      : undefined;
    const url = String(e?.id ?? "");
    const year = e?.published ? Number(String(e.published).slice(0, 4)) : undefined;
    const authors = Array.isArray(e?.author) 
      ? e.author.map((a: any) => ({ author: a?.name, id: null }))
      : [{ author: e?.author?.name, id: null }];
    const summary = e?.summary;
    
    const paper: any = { 
      id, 
      source: "arxiv", 
      arxivId: id, 
      title, 
      abstract: summary,
      authors 
    };
    if (pdfLink) paper.pdfUrl = pdfLink;
    if (url) paper.url = url;
    if (year) paper.year = year;
    
    return paper;
  }

  return (
    <div className="fade-in">
      <div className="search-section">
        <div className="search-controls">
          <input 
            value={q} 
            onChange={(e)=>setQ(e.target.value)} 
            placeholder="🔍 Search for papers..." 
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
          <label className="checkbox-wrapper">
            <input 
              type="checkbox" 
              checked={openAccess} 
              onChange={(e)=>setOpenAccess(e.target.checked)} 
            />
            <span>Open Access</span>
          </label>
          <button 
            onClick={onSearch} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Searching...
              </>
            ) : (
              <>🚀 Search</>
            )}
          </button>
        </div>
      </div>
      
      {results && (
        <div className="results-grid fade-in">
          <div className="results-column">
            <div className="column-header">
              <span className="source-badge badge-openalex">OpenAlex</span>
              <h3 className="column-title">Academic Papers</h3>
            </div>
            {results?.openalex?.results?.length > 0 ? (
              results.openalex.results.map((w: any) => (
                <div key={w.id} className="paper-card">
                  <div className="paper-title">{w.title}</div>
                  <div className="paper-meta">
                    📅 {w.publication_year || 'N/A'} 
                    {w?.host_venue?.display_name && (
                      <> • 📖 {w.host_venue.display_name}</>
                    )}
                  </div>
                  <div className="paper-actions">
                    <button 
                      onClick={() => onSaveOpenAlex(w)}
                      className="btn btn-secondary btn-small"
                    >
                      💾 Save
                    </button>
                    <button 
                      onClick={() => nav(`/detail/${encodeURIComponent(String(w.id))}`)}
                      className="btn btn-secondary btn-small"
                    >
                      📄 Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">No results from OpenAlex</div>
              </div>
            )}
          </div>
          
          <div className="results-column">
            <div className="column-header">
              <span className="source-badge badge-arxiv">arXiv</span>
              <h3 className="column-title">Preprints</h3>
            </div>
            {(() => {
              const entries = Array.isArray(results?.arxiv?.feed?.entry) ? results.arxiv.feed.entry : [];
              return entries.length > 0 ? (
                entries.map((e: any) => (
                  <div key={e.id} className="paper-card">
                    <div className="paper-title">{e.title}</div>
                    <div className="paper-meta">
                      📅 {e.published ? new Date(e.published).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="paper-actions">
                      <button 
                        onClick={() => onSaveArxiv(e)}
                        className="btn btn-secondary btn-small"
                      >
                        💾 Save
                      </button>
                      <button 
                        onClick={() => nav(`/detail/${encodeURIComponent(String(e.id))}`)}
                        className="btn btn-secondary btn-small"
                      >
                        📄 Details
                      </button>
                      <a 
                        href={e.id} 
                        target="_blank"
                        className="paper-link"
                      >
                        🔗 arXiv
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-text">No results from arXiv</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {!results && !loading && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">
            Enter a search query to find papers
          </div>
        </div>
      )}
    </div>
  );
}

