const API_URL = "http://localhost:8080/api/favorites";

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

function resolveProductId(input) {
  const raw =
    input && typeof input === "object"
      ? (input.productId ?? input.id)
      : input;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function getUserFavorites() {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");

  const res = await fetch(API_URL, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Error obteniendo favoritos");
  }
  return res.json();
}

export async function addFavorite(productId) {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  if (isTokenExpired(token)) throw new Error("Token expirado");
  const resolvedProductId = resolveProductId(productId);
  if (!resolvedProductId) {
    throw new Error("Vuelo sin productId persistido; no se puede favoritear");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: resolvedProductId }),
  });

  if (!res.ok) {
    const message = await res.text();
    console.error("POST /api/favorites falló", {
      status: res.status,
      statusText: res.statusText,
      responseMessage: message,
      hasToken: Boolean(token),
      tokenPrefix: token?.slice(0, 16),
    });
    throw new Error(message || "Error agregando favorito");
  }
  return res.text();
}

export async function removeFavorite(productId) {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");
  const resolvedProductId = resolveProductId(productId);
  if (!resolvedProductId) {
    throw new Error("Vuelo sin productId persistido; no se puede quitar favorito");
  }

  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: resolvedProductId }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Error eliminando favorito");
  }
  return true;
}
