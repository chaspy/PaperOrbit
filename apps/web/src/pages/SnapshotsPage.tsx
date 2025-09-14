import React, { useEffect, useState } from "react";
import api from "../api";

export function SnapshotsPage() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/snapshots");
        setList(res.data);
      } catch (err) {
        console.error("Failed to fetch snapshots:", err);
      }
    })();
  }, []);

  async function open(id: string) {
    setLoading(true);
    try {
      const res = await api.get(`/api/snapshots/${encodeURIComponent(id)}`);
      setSelected(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '350px 1fr', 
        gap: '2rem',
        minHeight: '600px'
      }}>
        <div className="results-column">
          <div className="column-header">
            <span className="source-badge badge-arxiv">History</span>
            <h3 className="column-title">Search Snapshots</h3>
          </div>
          
          {list.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {list.map((s) => (
                <button 
                  key={s.id}
                  onClick={() => open(s.id)}
                  className={`paper-card ${selected?.id === s.id ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '1rem',
                    border: selected?.id === s.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                    background: selected?.id === s.id ? 'rgba(102, 126, 234, 0.1)' : 'var(--dark-surface-light)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ 
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    🔍 {s.query}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    📅 {new Date(s.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📸</div>
              <div className="empty-state-text">No snapshots yet</div>
            </div>
          )}
        </div>

        <div className="detail-container">
          <div className="detail-header" style={{ paddingBottom: '1rem' }}>
            <h2 className="detail-title" style={{ fontSize: '1.5rem' }}>
              {selected ? `📸 Snapshot: ${selected.query}` : '📋 Snapshot Details'}
            </h2>
            {selected && (
              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-label">📅 Created:</span>
                  <span>{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                {selected.resultIds && (
                  <div className="meta-item">
                    <span className="meta-label">📊 Results:</span>
                    <span>
                      {selected.resultIds.openalex?.length || 0} OpenAlex, {selected.resultIds.arxiv?.length || 0} arXiv
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '300px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span className="loading-spinner" style={{ 
                  width: '40px', 
                  height: '40px',
                  marginBottom: '1rem'
                }}></span>
                <div className="loading-text">Loading snapshot...</div>
              </div>
            </div>
          ) : selected ? (
            <>
              {selected.filtersJson && Object.keys(selected.filtersJson).length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">🎯 Search Filters</h3>
                  <div className="section-content">
                    <pre style={{ 
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      font: 'inherit',
                      fontSize: '0.875rem'
                    }}>
                      {JSON.stringify(selected.filtersJson, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3 className="section-title">📝 Raw Data</h3>
                <div className="section-content" style={{ 
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'Monaco, monospace',
                    lineHeight: 1.5
                  }}>
                    {JSON.stringify(selected.rawJson, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👈</div>
              <div className="empty-state-text">
                Select a snapshot from the list to view details
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}