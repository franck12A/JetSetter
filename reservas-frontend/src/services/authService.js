// src/services/authService.js
export const registerUser = async (data) => {
  const res = await fetch("http://localhost:8080/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Funciones que requieren token
export const addFavorite = async (userId, productId, token) => {
  const res = await fetch(`http://localhost:8080/api/auth/${userId}/favorites/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
