const API_URL = "http://localhost:8080/api/favorites";

export async function getUserFavorites() {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Error obteniendo favoritos");
  return res.json();
}

export async function addFavorite(productId) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!res.ok) throw new Error("Error agregando favorito");
  return res.json();
}

export async function removeFavorite(productId) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!res.ok) throw new Error("Error eliminando favorito");
  return true;
}
