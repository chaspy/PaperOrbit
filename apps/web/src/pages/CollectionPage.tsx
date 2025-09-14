import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export function CollectionPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/papers");
        setPapers(res.data);
      } catch (err) {
        console.error("Failed to fetch papers:", err);
      }
    })();
  }, []);

  async function onLocalSearch() {
    if (!q) return setResults([]);
    setLoading(true);
    try {
      const res = await api.post("/api/local-search", { q });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }

  const displayItems = results.length > 0 ? results.map(r => ({ ...r.paper, score: r.score })) : (q ? [] : papers);

  return (
    <div className="fade-in">
      <div className="search-section">
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: 700, 
          marginBottom: "1.5rem",
          background: "var(--primary-gradient)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          📚 Saved Papers Collection
        </h2>
        <div className="search-controls">
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="🔍 Search in your collection..." 
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && onLocalSearch()}
          />
          <button 
            onClick={onLocalSearch}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Searching...
              </>
            ) : (
              <>🔍 Search</>
            )}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Found {results.length} papers matching your query
          </div>
        )}
      </div>

      <div className="results-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="results-column">
          {displayItems.length > 0 ? (
            displayItems.map((paper: any) => (
              <div key={paper.id} className="paper-card">
                <div className="paper-title">{paper.title}</div>
                <div className="paper-meta">
                  {paper.year && <>📅 {paper.year}</>}
                  {paper.venue && <> • 📖 {paper.venue}</>}
                  {paper.source && (
                    <> • <span className={`source-badge ${paper.source === 'openalex' ? 'badge-openalex' : 'badge-arxiv'}`} style={{ fontSize: "0.75rem" }}>
                      {paper.source}
                    </span></>
                  )}
                </div>
                {paper.score !== undefined && (
                  <div style={{ 
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    background: "linear-gradient(135deg, #4fd1c5 0%, #667eea 100%)",
                    borderRadius: "20px",
                    display: "inline-block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    Relevance: {(paper.score * 100).toFixed(1)}%
                  </div>
                )}
                {paper.summaryJa && (
                  <div style={{ 
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    background: "rgba(102, 126, 234, 0.1)",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    maxHeight: "100px",
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    {paper.summaryJa.slice(0, 150)}...
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "30px",
                      background: "linear-gradient(transparent, var(--dark-surface-light))"
                    }} />
                  </div>
                )}
                <div className="paper-actions">
                  <button 
                    onClick={() => nav(`/detail/${encodeURIComponent(paper.id)}`)}
                    className="btn btn-secondary btn-small"
                  >
                    📄 View Details
                  </button>
                  {paper.url && (
                    <a 
                      href={paper.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-link"
                    >
                      🔗 Paper Link
                    </a>
                  )}
                  {paper.pdfUrl && (
                    <a 
                      href={paper.pdfUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-link"
                    >
                      📑 PDF
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                {q ? "🔍" : "📭"}
              </div>
              <div className="empty-state-text">
                {q ? "No papers found matching your query" : "No papers saved yet"}
              </div>
              {!q && (
                <button 
                  onClick={() => nav("/")}
                  className="btn btn-secondary"
                  style={{ marginTop: "1rem" }}
                >
                  🔍 Search for Papers
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

