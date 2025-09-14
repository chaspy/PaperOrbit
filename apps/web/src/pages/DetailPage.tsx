import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export function DetailPage() {
  const { id } = useParams<{id: string}>();
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      if (!id) return;
      // Try to get paper from DB by ID
      const res = await api.get(`/api/papers/${encodeURIComponent(id)}`).catch(()=>null);
      setPaper(res?.data ?? null);
    })();
  }, [id]);

  async function summarize() {
    if (!paper) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/summarize/${encodeURIComponent(paper.id)}`);
      alert("要約を更新しました");
      setPaper({ ...paper, summaryJa: [res.data.summary.background_problem, res.data.summary.method_results, res.data.summary.limitations_future].join("\n\n") });
    } finally { setLoading(false); }
  }

  async function fetchPdf() {
    if (!paper) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/pdf/${encodeURIComponent(paper.id)}`);
      alert(`PDF 取得: ${res.data.chars} chars`);
    } finally { setLoading(false); }
  }

  async function embed() {
    if (!paper) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/embed/${encodeURIComponent(paper.id)}`);
      alert(`埋め込み作成 dim=${res.data.dim}`);
    } finally { setLoading(false); }
  }

  if (!paper) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">📄</div>
        <div className="empty-state-text">Paper not found / 保存後に表示できます</div>
        <button 
          onClick={() => nav("/")} 
          className="btn btn-secondary" 
          style={{ marginTop: "1rem" }}
        >
          🔍 Search Papers
        </button>
      </div>
    );
  }

  return (
    <div className="detail-container fade-in">
      <div className="detail-header">
        <h2 className="detail-title">{paper.title}</h2>
        <div className="detail-meta">
          {paper.year && (
            <div className="meta-item">
              <span className="meta-label">📅 Year:</span>
              <span>{paper.year}</span>
            </div>
          )}
          {paper.venue && (
            <div className="meta-item">
              <span className="meta-label">📖 Venue:</span>
              <span>{paper.venue}</span>
            </div>
          )}
          {paper.source && (
            <div className="meta-item">
              <span className="meta-label">🌐 Source:</span>
              <span className={`source-badge ${paper.source === 'openalex' ? 'badge-openalex' : 'badge-arxiv'}`}>
                {paper.source}
              </span>
            </div>
          )}
        </div>
      </div>

      {paper.abstract && (
        <div className="detail-section">
          <h3 className="section-title">
            📝 Abstract
          </h3>
          <div className="section-content">
            {paper.abstract}
          </div>
        </div>
      )}

      {paper.summaryJa && (
        <div className="detail-section">
          <h3 className="section-title">
            🇯🇵 要約 (日本語)
          </h3>
          <div className="section-content">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, font: "inherit" }}>
              {paper.summaryJa}
            </pre>
          </div>
        </div>
      )}

      {paper.authorsJson && (
        <div className="detail-section">
          <h3 className="section-title">
            👥 Authors
          </h3>
          <div className="section-content">
            {(() => {
              try {
                const authors = JSON.parse(paper.authorsJson);
                return authors.map((a: any, i: number) => (
                  <span key={i}>
                    {a.author}
                    {i < authors.length - 1 && ", "}
                  </span>
                ));
              } catch {
                return paper.authorsJson;
              }
            })()}
          </div>
        </div>
      )}

      {paper.topicsJson && paper.topicsJson !== "[]" && (
        <div className="detail-section">
          <h3 className="section-title">
            🏷️ Topics
          </h3>
          <div className="section-content">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(() => {
                try {
                  const topics = JSON.parse(paper.topicsJson);
                  return topics.map((t: any, i: number) => (
                    <span 
                      key={i} 
                      className="source-badge badge-openalex"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {t.display_name || t}
                    </span>
                  ));
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button 
          onClick={summarize} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              処理中...
            </>
          ) : (
            <>📊 要約生成</>
          )}
        </button>
        
        <button 
          onClick={fetchPdf} 
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              処理中...
            </>
          ) : (
            <>📄 PDF取得</>
          )}
        </button>
        
        <button 
          onClick={embed} 
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              処理中...
            </>
          ) : (
            <>🔗 埋め込み作成</>
          )}
        </button>

        {paper.url && (
          <a 
            href={paper.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: "none" }}
          >
            🔗 Paper Link
          </a>
        )}
        
        {paper.pdfUrl && (
          <a 
            href={paper.pdfUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: "none" }}
          >
            📑 PDF Direct
          </a>
        )}

        <button 
          onClick={() => nav("/")}
          className="btn btn-secondary"
        >
          ← Back to Search
        </button>
      </div>
    </div>
  );
}

