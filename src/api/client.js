const BASE = "/api";

async function request(path, { method = "GET", body } = {}) {
  const options = {
    method,
    credentials: "include",
    headers: {},
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || "Request failed");
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}

export const api = {
  listPlaces: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category && params.category !== "All") qs.set("category", params.category);
    if (params.sort) qs.set("sort", params.sort);
    const query = qs.toString();
    return request(`/places${query ? `?${query}` : ""}`);
  },

  getPlace: (id) => request(`/places/${id}`),

  getCategories: () => request("/places/categories"),

  adminPlaces: () => request("/places/admin/all"),

  createPlace: (data) => request("/places", { method: "POST", body: data }),

  updatePlace: (id, data) => request(`/places/${id}`, { method: "PUT", body: data }),

  patchPlace: (id, data) => request(`/places/${id}`, { method: "PATCH", body: data }),

  softDeletePlace: (id) => request(`/places/${id}`, { method: "DELETE" }),

  restorePlace: (id) => request(`/places/restore/${id}`, { method: "POST" }),

  bulkUpdate: (ids, updates) =>
    request("/places/bulk-update", { method: "POST", body: { ids, updates } }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password } }),

  logout: () => request("/auth/logout", { method: "POST" }),

  getSession: () => request("/auth/session"),

  getCategoryList: () => request("/categories"),
  createCategory: (name) => request("/categories", { method: "POST", body: { name } }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
  renameCategory: (id, name) => request(`/categories/${id}`, { method: "PUT", body: { name } }),
};