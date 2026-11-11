
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  checkBackendHealth,
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  type HealthResponse,
  type SupportTicket,
} from "./services/api";

import AIHero3D from "./components/AIHero3D";
import AIChatAssistant from "./components/AIChatAssistant";
import "./App.css";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High";
type StatusFilter = "All" | TicketStatus;

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState("Not checked");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);

  const [updatingPriorityId, setUpdatingPriorityId] =
    useState<number | null>(null);

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    message: "",
    priority: "Medium" as TicketPriority,
  });

  // BACKEND HEALTH

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

  // LOAD TICKETS

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);

    try {
      const result = await getTickets();
      setTickets(result);
      setTicketError("");
    } catch (error) {
      setTicketError(
        error instanceof Error ? error.message : "Unable to load tickets."
      );
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    void loadTickets();

    const interval = window.setInterval(() => {
      void loadHealth();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadHealth, loadTickets]);

  // DASHBOARD COUNTS

  const backendOnline = health?.backend === "running";
  const databaseOnline = health?.database === "connected";

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "Closed"
  ).length;

  // SEARCH AND FILTER

  const filteredTickets = tickets.filter((ticket) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      ticket.customer_name.toLowerCase().includes(search) ||
      ticket.customer_email.toLowerCase().includes(search) ||
      ticket.subject.toLowerCase().includes(search);

    const matchesPriority =
      priorityFilter === "All" || ticket.priority === priorityFilter;

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // CREATE TICKET

  const handleCreateTicket = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitting(true);
    setTicketError("");

    try {
      await createTicket(form);

      setForm({
        customer_name: "",
        customer_email: "",
        subject: "",
        message: "",
        priority: "Medium",
      });

      setStatusFilter("All");
      setPriorityFilter("All");
      setSearchTerm("");

      await loadTickets();
    } catch (error) {
      setTicketError(
        error instanceof Error ? error.message : "Unable to create ticket."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE PRIORITY

  const handleUpdatePriority = async (
    ticketId: number,
    priority: TicketPriority
  ) => {
    setUpdatingPriorityId(ticketId);
    setTicketError("");

    try {
      const updatedTicket = await updateTicket(ticketId, { priority });

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? updatedTicket : ticket
        )
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      setTicketError(
        error instanceof Error ? error.message : "Unable to update priority."
      );
      await loadTickets();
    } finally {
      setUpdatingPriorityId(null);
    }
  };

  // UPDATE STATUS

  const handleUpdateStatus = async (
    ticketId: number,
    status: TicketStatus
  ) => {
    setUpdatingStatusId(ticketId);
    setTicketError("");

    try {
      const updatedTicket = await updateTicket(ticketId, { status });

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? updatedTicket : ticket
        )
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      setTicketError(
        error instanceof Error ? error.message : "Unable to update status."
      );
      await loadTickets();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // DELETE TICKET

  const handleDeleteTicket = async (ticketId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ticket #${ticketId}?`
    );

    if (!confirmed) return;

    setTicketError("");

    try {
      await deleteTicket(ticketId);

      setTickets((current) =>
        current.filter((ticket) => ticket.id !== ticketId)
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      setTicketError(
        error instanceof Error ? error.message : "Unable to delete ticket."
      );
    }
  };

  // RESET FILTERS

  const resetFilters = () => {
    setSearchTerm("");
    setPriorityFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="app-shell" id="home">

      {/* HEADER */}

      <header className="site-header">
        <a href="#home" className="brand">
          <div className="brand-icon">✧</div>
          <div>
            <strong>INTELLISUPPORT</strong>
            <span>AI SUPPORT PLATFORM</span>
          </div>
        </a>

        <nav className="top-navigation">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#tickets">Tickets</a>
          <a href="#ai-assistant">AI Assistant</a>
          <a href="#about">About</a>
        </nav>

        <a href="#tickets" className="header-button">
          Get Started <span>↗</span>
        </a>
      </header>

      <main>

        {/* HERO SECTION WITH 3D AI */}

        <section className="hero-section">
          <div className="hero-content">
            <p className="eyebrow">
              INTELLIGENCE · AUTOMATION · CUSTOMER EXPERIENCE
            </p>

            <h1>
              SUPPORT
              <br />
              REIMAGINED.
              <br />
              <span>POWERED BY AI.</span>
            </h1>

            <p className="hero-description">
              Transform customer support with intelligent automation,
              AI-powered assistance, and a smarter way to manage every
              customer interaction.
            </p>

            <div className="hero-actions">
              <a href="#tickets" className="primary-button">
                Explore Dashboard <span>→</span>
              </a>

              <a href="#services" className="secondary-button">
                Discover Services
              </a>
            </div>

            <div className="hero-caption">
              <span className="caption-line"></span>
              BUILT FOR THE FUTURE OF CUSTOMER SUPPORT
            </div>
          </div>

          {/* REAL 3D AI COMPONENT */}

          <div className="hero-visual">
            <AIHero3D />

            <div className="floating-card floating-card-top">
              <span className="floating-icon">✧</span>
              <div>
                <strong>AI ASSISTANT</strong>
                <small>Intelligence for every interaction</small>
              </div>
            </div>

            <div className="floating-card floating-card-bottom">
              <span className="live-indicator"></span>
              <div>
                <strong>PLATFORM STATUS</strong>
                <small>
                  {backendOnline ? "System operational" : "Checking system"}
                </small>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}

        <section className="services-section" id="services">
          <div className="section-heading">
            <p className="eyebrow">WHAT WE OFFER</p>
            <h2>
              INTELLIGENT <span>SOLUTIONS</span>
            </h2>
            <p>
              Everything you need to deliver exceptional customer support.
            </p>
          </div>

          <div className="services-grid">
            <a href="#tickets" className="service-card">
              <span className="service-icon">&lt;/&gt;</span>
              <h3>Ticket Management</h3>
              <p>
                Create, organize, prioritize, and resolve customer issues.
              </p>
              <span className="service-arrow">↗</span>
            </a>

            <a href="#ai-assistant" className="service-card">
              <span className="service-icon">✧</span>
              <h3>AI Assistance</h3>
              <p>Ask questions and receive answers from your support documents.</p>
              <span className="service-arrow">↗</span>
            </a>

            <a href="#ai-assistant" className="service-card">
              <span className="service-icon">▤</span>
              <h3>Knowledge Base</h3>
              <p>
                Retrieve information from uploaded support documents.
              </p>
              <span className="service-arrow">↗</span>
            </a>

            <a href="#dashboard" className="service-card">
              <span className="service-icon">◈</span>
              <h3>Analytics</h3>
              <p>Monitor support activity and track ticket performance.</p>
              <span className="service-arrow">↗</span>
            </a>

            <a href="#agents" className="service-card">
              <span className="service-icon">◎</span>
              <h3>AI Agents</h3>
              <p>
                Prepare intelligent workflows for support automation.
              </p>
              <span className="service-arrow">↗</span>
            </a>

            <a href="#about" className="service-card">
              <span className="service-icon">⌘</span>
              <h3>Smart Workflows</h3>
              <p>
                Connect support operations through automated processes.
              </p>
              <span className="service-arrow">↗</span>
            </a>
          </div>
        </section>

        {/* DASHBOARD */}

        <section className="dashboard-section" id="dashboard">
          <div className="section-heading">
            <p className="eyebrow">LIVE PLATFORM OVERVIEW</p>
            <h2>
              YOUR SUPPORT <span>AT A GLANCE</span>
            </h2>
          </div>

          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <span className="dashboard-stat-icon">▣</span>
              <strong>{totalTickets}</strong>
              <span>Total Tickets</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-icon">◷</span>
              <strong>{openTickets}</strong>
              <span>Open Tickets</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-icon">↻</span>
              <strong>{inProgressTickets}</strong>
              <span>In Progress</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-icon">✓</span>
              <strong>{resolvedTickets}</strong>
              <span>Resolved</span>
            </div>
          </div>

          {/* SYSTEM STATUS */}

          <div className="system-status-panel">
            <div>
              <span
                className={`system-dot ${backendOnline ? "active" : ""}`}
              ></span>
              <strong>Backend API</strong>
              <small>
                {loading
                  ? "Checking..."
                  : backendOnline
                    ? "Online"
                    : "Offline"}
              </small>
            </div>

            <div>
              <span
                className={`system-dot ${databaseOnline ? "active" : ""}`}
              ></span>
              <strong>Database</strong>
              <small>
                {loading
                  ? "Checking..."
                  : databaseOnline
                    ? "Connected"
                    : "Offline"}
              </small>
            </div>

            <div>
              <span className="system-dot active"></span>
              <strong>Local RAG AI Engine</strong>
              <small>Ollama integration enabled</small>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void loadHealth();
                void loadTickets();
              }}
              disabled={loading}
            >
              {loading ? "Checking..." : "↻ Refresh"}
            </button>
          </div>

          <p className="last-checked">Last checked: {lastChecked}</p>
        </section>

        {/* TICKET MANAGEMENT */}

        <section className="ticket-section" id="tickets">
          <div className="section-heading">
            <p className="eyebrow">CUSTOMER OPERATIONS</p>
            <h2>
              SUPPORT <span>TICKET CENTER</span>
            </h2>
            <p>
              Manage customer requests from one intelligent workspace.
            </p>
          </div>

          {/* TICKET STATISTICS */}

          <div className="ticket-stats-grid">
            {(
              [
                ["All", "Total Tickets", totalTickets],
                ["Open", "Open", openTickets],
                ["In Progress", "In Progress", inProgressTickets],
                ["Resolved", "Resolved", resolvedTickets],
                ["Closed", "Closed", closedTickets],
              ] as const
            ).map(([status, label, count]) => (
              <button
                type="button"
                key={status}
                className={`ticket-stat-card ${
                  statusFilter === status ? "selected-stat" : ""
                }`}
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>

          {ticketError && (
            <div className="ticket-error" role="alert">
              {ticketError}
            </div>
          )}

          {/* CREATE TICKET */}

          <div className="ticket-form-panel">
            <div className="ticket-heading">
              <div>
                <p className="eyebrow">NEW REQUEST</p>
                <h3>Create Support Ticket</h3>
              </div>
              <span className="form-heading-icon">＋</span>
            </div>

            <form className="ticket-form" onSubmit={handleCreateTicket}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="customer_name">Customer Name</label>
                  <input
                    id="customer_name"
                    type="text"
                    value={form.customer_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        customer_name: event.target.value,
                      })
                    }
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer_email">Customer Email</label>
                  <input
                    id="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        customer_email: event.target.value,
                      })
                    }
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={form.subject}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        subject: event.target.value,
                      })
                    }
                    placeholder="Enter issue subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value as TicketPriority,
                      })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Issue Description</label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      message: event.target.value,
                    })
                  }
                  placeholder="Describe the customer's issue..."
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "＋ Create Ticket"}
              </button>
            </form>
          </div>

          {/* TICKET LIST */}

          <div className="ticket-list-panel">
            <div className="ticket-heading">
              <div>
                <p className="eyebrow">REQUEST OVERVIEW</p>
                <h3>All Support Tickets</h3>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => void loadTickets()}
                disabled={ticketsLoading}
              >
                {ticketsLoading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            {/* FILTERS */}

            <div className="ticket-filters">
              <input
                type="search"
                placeholder="Search customer, email or subject..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>

            <p className="ticket-result-count">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>

            {/* TABLE */}

            <div className="ticket-table-wrapper">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Details</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {ticketsLoading ? (
                    <tr>
                      <td colSpan={8} className="ticket-empty">
                        Loading tickets...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="ticket-empty">
                        {tickets.length === 0
                          ? "No tickets yet. Create your first support ticket."
                          : "No tickets match your filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>#{ticket.id}</td>

                        <td>
                          <strong>{ticket.customer_name}</strong>
                          <br />
                          <small>{ticket.customer_email}</small>
                        </td>

                        <td title={ticket.message}>{ticket.subject}</td>

                        {/* PRIORITY UPDATE */}

                        <td>
                          <select
                            className="priority-select"
                            value={ticket.priority}
                            disabled={updatingPriorityId === ticket.id}
                            onChange={(event) =>
                              void handleUpdatePriority(
                                ticket.id,
                                event.target.value as TicketPriority
                              )
                            }
                            aria-label={`Priority for ticket ${ticket.id}`}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>

                          {updatingPriorityId === ticket.id && (
                            <small>Saving...</small>
                          )}
                        </td>

                        {/* STATUS UPDATE */}

                        <td>
                          <select
                            value={ticket.status}
                            disabled={updatingStatusId === ticket.id}
                            onChange={(event) =>
                              void handleUpdateStatus(
                                ticket.id,
                                event.target.value as TicketStatus
                              )
                            }
                            aria-label={`Status for ticket ${ticket.id}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>

                          {updatingStatusId === ticket.id && (
                            <small>Saving...</small>
                          )}
                        </td>

                        <td>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="table-button"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </button>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => void handleDeleteTicket(ticket.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RAG AI KNOWLEDGE ASSISTANT */}

        <AIChatAssistant />

        {/* AI AGENTS */}

        <section className="future-section" id="agents">
          <p className="eyebrow">COMING NEXT</p>
          <h2>
            AI <span>AGENT WORKFLOWS</span>
          </h2>
          <p>
            Intelligent agents will help automate support tasks and
            coordinate customer service workflows.
          </p>
          <span className="future-tag">AGENT MODULE — UPCOMING</span>
        </section>

        {/* ABOUT */}

        <section className="about-section" id="about">
          <div>
            <p className="eyebrow">THE PLATFORM</p>
            <h2>
              A SMARTER WAY TO <span>SUPPORT PEOPLE.</span>
            </h2>
          </div>

          <p>
            IntelliSupport AI brings customer support operations,
            intelligent assistance, and knowledge management together
            in one modern platform.
          </p>
        </section>
      </main>

      {/* TICKET DETAILS MODAL */}

      {selectedTicket && (
        <div
          className="ticket-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="ticket-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ticket-heading">
              <div>
                <p className="eyebrow">SUPPORT REQUEST</p>
                <h3 id="ticket-details-title">
                  Ticket #{selectedTicket.id}
                </h3>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close ticket details"
              >
                ×
              </button>
            </div>

            <div className="ticket-detail-list">
              <div>
                <span>Customer</span>
                <strong>{selectedTicket.customer_name}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selectedTicket.customer_email}</strong>
              </div>

              <div>
                <span>Subject</span>
                <strong>{selectedTicket.subject}</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>{selectedTicket.priority}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedTicket.status}</strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </strong>
              </div>

              <div className="ticket-detail-message">
                <span>Issue Description</span>
                <p>{selectedTicket.message}</p>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setSelectedTicket(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="site-footer">
        <a href="#home" className="brand footer-brand">
          <div className="brand-icon">✧</div>
          <div>
            <strong>INTELLISUPPORT</strong>
            <span>AI SUPPORT PLATFORM</span>
          </div>
        </a>

        <span>IntelliSupport AI © 2026</span>
        <span>Built for intelligent customer support</span>
      </footer>
    </div>
  );
}

export default App;
