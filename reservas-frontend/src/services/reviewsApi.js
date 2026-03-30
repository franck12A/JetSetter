const API_URL = "http://localhost:8080/api/reviews";

async function readErrorBody(res) {
  try {
    const text = await res.text();
    return String(text || "").trim();
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

export async function getProductReviews(productId) {
  if (!productId) return [];
  const token = getAuthToken();
  const headers = {};
  if (token && !isTokenExpired(token)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/product/${productId}`, { headers });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || "No se pudieron obtener las reseñas");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getReviewsSummary(productIds = []) {
  const ids = Array.isArray(productIds) ? productIds.filter(Boolean) : [];
  if (!ids.length) return [];
  const query = ids.join(",");
  const token = getAuthToken();
  const headers = {};
  if (token && !isTokenExpired(token)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/summary?productIds=${query}`, { headers });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || "No se pudo obtener el resumen de valoraciones");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createReview({ productId, rating, comment }) {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  if (isTokenExpired(token)) throw new Error("Token expirado");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      rating,
      comment,
    }),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    const detail =
      body ||
      `${res.status} ${res.statusText}`.trim() ||
      String(res.status || "").trim() ||
      "Error desconocido";
    throw new Error(detail);
  }

  return res.json();
}

