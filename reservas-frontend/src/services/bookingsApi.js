const API_URL = "http://localhost:8080/api/bookings";

async function readErrorBody(res) {
  try {
    const text = await res.text();
    const normalized = String(text || "").trim();
    if (!normalized) return "";
    try {
      const parsed = JSON.parse(normalized);
      return parsed?.message || parsed?.error || normalized;
    } catch {
      return normalized;
    }
  } catch {
    return "";
  }
}

function getAuthToken() {
  const directToken = localStorage.getItem("token");
  if (directToken && directToken !== "null" && directToken !== "undefined") {
    return directToken.startsWith("Bearer ") ? directToken.slice(7) : directToken;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userToken = user?.token;
    if (!userToken || userToken === "null" || userToken === "undefined") return null;
    return userToken.startsWith("Bearer ") ? userToken.slice(7) : userToken;
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function normalizeDateStr(dateStr) {
  if (!dateStr) return "";

  const direct = String(dateStr).trim();
  if (!direct) return "";

  const parsed = new Date(direct);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const m = direct.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }

  const withTime = direct.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (withTime) {
    const day = withTime[1].padStart(2, "0");
    const month = withTime[2].padStart(2, "0");
    return `${withTime[3]}-${month}-${day}`;
  }

  return direct;
}

export async function createBooking({ productId, dateStr, returnDateStr = "", passengers = 1 }) {
  const normalizedDateStr = normalizeDateStr(dateStr);
  const normalizedReturnDateStr = normalizeDateStr(returnDateStr);
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  if (isTokenExpired(token)) throw new Error("Token expirado");

  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      dateStr: normalizedDateStr,
      returnDateStr: normalizedReturnDateStr || null,
      passengers,
    }),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    const detail =
      body ||
      `${res.status} ${res.statusText}`.trim() ||
      String(res.status || "").trim() ||
      "Error desconocido";
    console.error("Error backend:", detail);
    throw new Error(detail);
  }

  return res.json();
}

export async function getUserBookings() {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  const res = await fetch(`${API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || "No se pudieron obtener las reservas");
  }
  return res.json();
}

export async function cancelBooking(id) {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || "No se pudo cancelar la reserva");
  }
  return res.json();
}

export async function getProductBookedDates(productId) {
  if (!productId) return [];
  const res = await fetch(`${API_URL}/product/${productId}/dates`);
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || "No se pudo obtener disponibilidad");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
