import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import api from "../api";

export function GraphPage() {
  const divRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [query, setQuery] = useState("LLM agent planning");
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!divRef.current) return;
    cyRef.current = cytoscape({ 
      container: divRef.current, 
      elements, 
      style: [
        { 
          selector: 'node', 
          style: { 
            'label': 'data(label)', 
            'font-size': 10,
            'background-color': '#667eea',
            'color': '#ffffff',
            'text-outline-color': '#1a1b3a',
            'text-outline-width': 2,
            'width': 30,
            'height': 30,
            'text-valign': 'bottom',
            'text-margin-y': 5
          } 
        },
        { 
          selector: 'edge', 
          style: { 
            'width': 2, 
            'line-color': '#4fd1c5',
            'target-arrow-color': '#4fd1c5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          } 
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#f093fb',
            'border-width': 3,
            'border-color': '#ffffff'
          }
        }
      ]
    });
    layout();
    return () => { cyRef.current?.destroy(); cyRef.current = null; };
  }, [divRef.current]);

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.elements().remove();
    cyRef.current.add(elements);
    layout();
  }, [elements]);

  function layout() {
    cyRef.current?.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
  }

  async function buildFromSearch() {
    setLoading(true);
    try {
      const res = await api.post("/api/search", { q: query, filters: { limit: 20 } });
      const oa = res.data?.openalex?.results ?? [];
      const nodes: any[] = [];
      const edges: any[] = [];
      for (const w of oa) {
        const id = String(w.id);
        nodes.push({ data: { id, label: (w.title || "").slice(0, 40) } });
        const refs = Array.isArray(w.referenced_works) ? w.referenced_works : [];
        for (const rid of refs) {
          const tid = String(rid);
          if (!nodes.find(n=> n.data.id === tid)) {
            nodes.push({ data: { id: tid, label: tid.split('/').pop() } });
          }
          edges.push({ data: { id: `${id}->${tid}`, source: id, target: tid } });
        }
      }
      setElements([...nodes, ...edges]);
    } finally {
      setLoading(false);
    }
  }

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
          🕸️ Citation Network Graph
        </h2>
        <div className="search-controls">
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="🔍 Search query for citation graph..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && buildFromSearch()}
          />
          <button 
            onClick={buildFromSearch}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Building Graph...
              </>
            ) : (
              <>📊 Build Citation Graph</>
            )}
          </button>
        </div>
        <div style={{ 
          marginTop: "1rem", 
          color: "var(--text-secondary)", 
          fontSize: "0.875rem" 
        }}>
          💡 Tip: Click and drag nodes to explore the network. Scroll to zoom.
        </div>
      </div>
      
      <div style={{
        background: "var(--dark-surface)",
        borderRadius: "20px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-xl)",
        marginTop: "2rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem"
        }}>
          <span className="source-badge badge-openalex">
            Graph Visualization
          </span>
          {elements.length > 0 && (
            <span style={{ 
              color: "var(--text-secondary)", 
              fontSize: "0.875rem" 
            }}>
              {elements.filter(e => !e.data.source).length} nodes, {elements.filter(e => e.data.source).length} edges
            </span>
          )}
        </div>
        <div 
          ref={divRef} 
          style={{ 
            width: '100%', 
            height: 600, 
            background: 'var(--dark-surface-light)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }} 
        />
        {elements.length === 0 && !loading && (
          <div className="empty-state" style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">
              Enter a search query to visualize citation networks
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

