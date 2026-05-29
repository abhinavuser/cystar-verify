const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setAuth(token: string, user: { id: string; name: string; email: string }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): { id: string; name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (body: { email: string; password: string; name: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  issueCredential: (body: {
    fields: Record<string, string>;
    issuerName: string;
    issueDate: string;
    credentialType?: string;
  }) => request("/api/credentials/issue", { method: "POST", body: JSON.stringify(body) }),

  getCredentials: () => request("/api/credentials"),

  getCredential: (id: string) => request(`/api/credentials/${id}`),

  shareCredential: (body: {
    credentialId: string;
    disclosedFields: string[];
    expiresInHours?: number;
  }) => request("/api/share/share", { method: "POST", body: JSON.stringify(body) }),

  getSharedPresentation: (token: string) => request(`/api/share/public/${token}`),

  verifyPresentation: (token: string) =>
    request("/api/share/verify", { method: "POST", body: JSON.stringify({ token }) }),
};
