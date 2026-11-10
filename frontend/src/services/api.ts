
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface HealthResponse {
  status: string;
  application: string;
  backend: string;
  database: string;
}

export interface SupportTicket {
  id: number;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface TicketCreate {
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  priority: "Low" | "Medium" | "High";
}

export interface TicketUpdate {
  subject?: string;
  message?: string;
  status?: "Open" | "In Progress" | "Resolved" | "Closed";
  priority?: "Low" | "Medium" | "High";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "API request failed");
  }

  return response.json() as Promise<T>;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return handleResponse<HealthResponse>(response);
}

export async function getTickets(): Promise<SupportTicket[]> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/`);
  return handleResponse<SupportTicket[]>(response);
}

export async function getTicket(id: number): Promise<SupportTicket> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/${id}`);
  return handleResponse<SupportTicket>(response);
}

export async function createTicket(
  ticket: TicketCreate
): Promise<SupportTicket> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticket),
  });

  return handleResponse<SupportTicket>(response);
}

export async function updateTicket(
  id: number,
  updates: TicketUpdate
): Promise<SupportTicket> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return handleResponse<SupportTicket>(response);
}

export async function deleteTicket(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
    method: "DELETE",
  });

  return handleResponse<{ message: string }>(response);
}
