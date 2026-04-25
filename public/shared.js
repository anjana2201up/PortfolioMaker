// ─── SHARED API HELPER ────────────────────────────────────────────────────────
// Uses relative URLs so it works on both localhost AND Vercel automatically.
// NEVER hardcode http://localhost:3000 in frontend files.

const API = {
  // ─── AUTH ──────────────────────────────────────────────────────────────────
  async register(name, email, password) {
    return API._post("/auth/register", { name, email, password });
  },

  async login(email, password) {
    return API._post("/auth/login", { email, password });
  },

  async getMe() {
    return API._get("/auth/me");
  },

  // ─── PROJECTS ──────────────────────────────────────────────────────────────
  async getProjects() {
    return API._get("/api/projects");
  },

  async getProject(id) {
    return API._get(`/api/projects/${id}`);
  },

  async createProject(data) {
    return API._post("/api/projects", data);
  },

  async updateProject(id, data) {
    return API._put(`/api/projects/${id}`, data);
  },

  async deleteProject(id) {
    return API._delete(`/api/projects/${id}`);
  },

  // ─── INTERNAL HELPERS ──────────────────────────────────────────────────────
  _headers() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async _get(url) {
    const res = await fetch(url, { headers: API._headers() });
    return API._handle(res);
  },

  async _post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: API._headers(),
      body: JSON.stringify(body),
    });
    return API._handle(res);
  },

  async _put(url, body) {
    const res = await fetch(url, {
      method: "PUT",
      headers: API._headers(),
      body: JSON.stringify(body),
    });
    return API._handle(res);
  },

  async _delete(url) {
    const res = await fetch(url, {
      method: "DELETE",
      headers: API._headers(),
    });
    return API._handle(res);
  },

  async _handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  // ─── AUTH HELPERS ──────────────────────────────────────────────────────────
  saveToken(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  },

  isLoggedIn() {
    return !!localStorage.getItem("token");
  },

  requireAuth() {
    if (!API.isLoggedIn()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  },
};