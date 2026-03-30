const API_URL = "http://localhost:8080/api/auth";

function resolveToken(contextToken) {
  const candidate = contextToken || localStorage.getItem("token");
  if (!candidate || candidate === "null" || candidate === "undefined") return null;
  return candidate.startsWith("Bearer ") ? candidate.slice(7) : candidate;
}

function getHeaders(contextToken) {
  const token = resolveToken(contextToken);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseErrorPayload(res, fallbackMessage) {
  const text = await res.text();
  if (!text) return fallbackMessage;
  try {
    const data = JSON.parse(text);
    return data?.error || data?.message || fallbackMessage;
  } catch {
    return text || fallbackMessage;
  }
}

async function parseResponse(res, fallbackMessage) {
  if (res.status === 401 || res.status === 403) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error(await parseErrorPayload(res, fallbackMessage));
  }

  if (res.status === 204) return null;
  return res.json();
}

function pickUsersArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function normalizeUser(raw) {
  const firstName = raw?.firstName || raw?.nombre || "";
  const lastName = raw?.lastName || raw?.apellido || "";
  const username = raw?.username || raw?.userName || "";
  const roleRaw = String(raw?.role || raw?.rol || "ROLE_USER").toUpperCase();
  const role = roleRaw.startsWith("ROLE_") ? roleRaw : `ROLE_${roleRaw}`;

  return {
    id: raw?.id,
    firstName,
    lastName,
    username,
    fullName: `${firstName} ${lastName}`.trim() || username || "Usuario sin nombre",
    email: raw?.email || raw?.mail || "sin correo",
    role,
  };
}

export async function listUsers(contextToken) {
  const res = await fetch(`${API_URL}/all`, {
    method: "GET",
    headers: getHeaders(contextToken),
  });

  const payload = await parseResponse(res, "No se pudieron obtener los usuarios");
  return pickUsersArray(payload).map(normalizeUser);
}

export async function updateUserRole({ userId, role, token }) {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ role }),
  });

  const payload = await parseResponse(res, "No se pudo actualizar el rol");
  return payload ? normalizeUser(payload) : null;
}

export async function deleteUser({ userId, token }) {
  const res = await fetch(`${API_URL}/${userId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  return parseResponse(res, "No se pudo eliminar el usuario");
}
