const API_BASE = (import.meta.env.VITE_API_BASE || "") + "/api/v1";

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/services`);
  if (!res.ok) throw new Error(`Failed to load services: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function fetchService(serviceCode) {
  const res = await fetch(`${API_BASE}/services/${serviceCode}`);
  if (!res.ok) throw new Error(`Failed to load service: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function registerUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = res.status === 409 ? "Username already taken" : `Registration failed (${res.status}). Please try again.`;
    try {
      const json = JSON.parse(text);
      if (json.message) message = json.message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function verifyCredentials(username, password) {
  const header = "Basic " + btoa(username + ":" + password);
  const res = await fetch(`${API_BASE}/auth/verify`, {
    headers: { Authorization: header },
  });
  return res.ok ? header : null;
}

export async function fetchTask(taskId, authHeader) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || json;
}

export function getSavedTaskIds() {
  try {
    return JSON.parse(localStorage.getItem("govguide-tasks") || "[]");
  } catch { return []; }
}

export function saveTaskId(taskId, serviceCode) {
  try {
    let tasks = getSavedTaskIds();
    const existing = tasks.findIndex(t => t.serviceCode === serviceCode);
    if (existing !== -1) {
      tasks[existing] = { taskId, serviceCode };
    } else {
      tasks.push({ taskId, serviceCode });
    }
    localStorage.setItem("govguide-tasks", JSON.stringify(tasks));
  } catch {}
}

export async function createTask(serviceCode, authHeader) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      serviceCode,
      context: { "workflow.selectedServiceRoute": serviceCode },
    }),
  });
  if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function fetchTaskApplication(taskId, authHeader) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/application`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) throw new Error(`Failed to load application: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function updateChecklistItem(taskId, requirementCode, state, authHeader) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/checklist-items/${requirementCode}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error(`Failed to update checklist: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}
