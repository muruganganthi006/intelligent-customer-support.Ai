import { useCallback, useEffect, useState } from "react";
import { checkBackendHealth, type HealthResponse } from "./services/api";
import "./App.css";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>("Not checked");

  const loadHealth = useCallback(async () => {
    setLoading(true);

    try {
      const result = await checkBackendHealth();
      setHealth(result);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setHealth(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();

    const interval = window.setInterval(() => {
      void loadHealth();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadHealth]);

  const backendOnline = health?.backend === "running";
  const databaseOnline = health?.database === "connected";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">IS</div>
          <div>
            <h2>IntelliSupport</h2>
            <span>AI SUPPORT PLATFORM</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-link active" href="#overview">
            <span>▦</span> Overview
          </a>
          <a className="nav-link" href="#conversations">
            <span>◫</span> Conversations
          </a>
          <a className="nav-link" href="#customers">
            <span>♙</span> Customers
          </a>
          <a className="nav-link" href="#knowledge">
            <span>▤</span> Knowledge Base
          </a>
          <a className="nav-link" href="#agents">
            <span>✧</span> AI Agents
          </a>
        </nav>

        <div className="sidebar-label settings-label">PREFERENCES</div>

        <nav className="navigation">
          <a className="nav-link" href="#settings">
            <span>⚙</span> Settings
          </a>
          <a className="nav-link" href="#help">
            <span>?</span> Help Center
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">M</div>
          <div className="profile-info">
            <strong>Administrator</strong>
            <span>Local workspace</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-right">
            <span className="environment">LOCAL DEVELOPMENT</span>
            <div className="notification">♧</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">INTELLIGENT CUSTOMER SUPPORT</p>
            <h1>Welcome to IntelliSupport AI</h1>
            <p className="welcome-description">
              Your intelligent workspace for customer support,
              AI-powered assistance, and knowledge management.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={() => void loadHealth()}
            disabled={loading}
          >
            ↻ {loading ? "Checking..." : "Refresh status"}
          </button>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total Conversations</span>
              <span className="stat-icon purple">◫</span>
            </div>
            <h2>0</h2>
            <p>Conversations created</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Active Customers</span>
              <span className="stat-icon blue">♙</span>
            </div>
            <h2>0</h2>
            <p>Registered customers</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Knowledge Documents</span>
              <span className="stat-icon orange">▤</span>
            </div>
            <h2>0</h2>
            <p>Documents indexed</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>AI Agents</span>
              <span className="stat-icon green">✧</span>
            </div>
            <h2>0</h2>
            <p>Agents configured</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel system-panel">
            <div className="panel-heading">
              <div>
                <h2>System Health</h2>
                <p>Live application connectivity</p>
              </div>
              <span className="live-label">
                <span className="live-dot"></span> LIVE CHECK
              </span>
            </div>

            <div className="health-list">
              <div className="health-row">
                <div className="health-name">
                  <span className="service-icon">API</span>
                  <div>
                    <strong>FastAPI Backend</strong>
                    <span>Application server</span>
                  </div>
                </div>
                <span className={`status ${backendOnline ? "online" : "offline"}`}>
                  {loading ? "Checking" : backendOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="health-row">
                <div className="health-name">
                  <span className="service-icon">DB</span>
                  <div>
                    <strong>Database</strong>
                    <span>SQLite connection</span>
                  </div>
                </div>
                <span className={`status ${databaseOnline ? "online" : "offline"}`}>
                  {loading ? "Checking" : databaseOnline ? "Connected" : "Offline"}
                </span>
              </div>

              <div className="health-row">
                <div className="health-name">
                  <span className="service-icon">AI</span>
                  <div>
                    <strong>Local AI Engine</strong>
                    <span>Ollama integration</span>
                  </div>
                </div>
                <span className="status pending">Pending setup</span>
              </div>
            </div>

            <div className="health-footer">
              <span>Last checked: {lastChecked}</span>
              <span>{health?.application || "IntelliSupport AI"}</span>
            </div>
          </article>

          <article className="panel assistant-panel">
            <div className="assistant-icon">✧</div>
            <p className="eyebrow">YOUR AI ASSISTANT</p>
            <h2>Intelligent Support Agent</h2>
            <p>
              An AI-powered support assistant designed to understand
              customer questions and provide accurate answers.
            </p>
            <div className="assistant-features">
              <span>✓ RAG-powered answers</span>
              <span>✓ Knowledge retrieval</span>
              <span>✓ Multi-agent workflows</span>
            </div>
            <button className="disabled-button" disabled>
              Chat interface — Coming soon
            </button>
          </article>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Project Development</h2>
              <p>Core platform components</p>
            </div>
          </div>

          <div className="development-grid">
            <div className="development-item">
              <span className="development-check">✓</span>
              <div>
                <strong>Frontend dashboard</strong>
                <span>React + TypeScript</span>
              </div>
              <span className="status online">Ready</span>
            </div>

            <div className="development-item">
              <span className="development-check">✓</span>
              <div>
                <strong>Backend API</strong>
                <span>FastAPI + Python</span>
              </div>
              <span className={`status ${backendOnline ? "online" : "offline"}`}>
                {backendOnline ? "Ready" : "Offline"}
              </span>
            </div>

            <div className="development-item">
              <span className="development-pending">○</span>
              <div>
                <strong>RAG knowledge engine</strong>
                <span>Document processing and retrieval</span>
              </div>
              <span className="status pending">Upcoming</span>
            </div>

            <div className="development-item">
              <span className="development-pending">○</span>
              <div>
                <strong>AI agent workflows</strong>
                <span>Intelligent task orchestration</span>
              </div>
              <span className="status pending">Upcoming</span>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>IntelliSupport AI © 2026</span>
          <span>Built for intelligent customer support</span>
        </footer>
      </main>
    </div>
  );
}

export default App;