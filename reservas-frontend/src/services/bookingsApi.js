const API_URL = "http://localhost:8080/api/bookings";

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

  return direct;
}

export async function createBooking({ userId, productId, dateStr, passengers }) {
  const normalizedDateStr = normalizeDateStr(dateStr);

  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      productId,
      dateStr: normalizedDateStr,
      passengers,
    }),
  });

  if (!res.ok) {
    console.error("Error backend:", await res.text());
    throw new Error("Error al crear reserva");
  }

  return res.json();
}

export async function getUserBookings(userId) {
  const res = await fetch(`${API_URL}/user`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function cancelBooking(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}
