import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SearchPage } from "./pages/SearchPage";
import { DetailPage } from "./pages/DetailPage";
import { GraphPage } from "./pages/GraphPage";
import { CollectionPage } from "./pages/CollectionPage";
import { SnapshotsPage } from "./pages/SnapshotsPage";
import "./styles/global.css";

function AppShell() {
  return (
    <BrowserRouter>
      <div>
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">🚀 PaperOrbit</h1>
            <nav style={{ 
              display: "flex", 
              gap: "1.5rem", 
              marginTop: "1rem" 
            }}>
              <Link to="/" style={{
                color: "var(--accent-cyan)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.3s ease"
              }}>📚 Search</Link>
              <Link to="/graph" style={{
                color: "var(--accent-cyan)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.3s ease"
              }}>🕸️ Graph</Link>
              <Link to="/collection" style={{
                color: "var(--accent-cyan)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.3s ease"
              }}>📁 Collection</Link>
              <Link to="/snapshots" style={{
                color: "var(--accent-cyan)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.3s ease"
              }}>📸 Snapshots</Link>
            </nav>
          </div>
        </header>
        <div className="container">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/snapshots" element={<SnapshotsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(<AppShell />);
