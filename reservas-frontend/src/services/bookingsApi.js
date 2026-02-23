const API_URL = "http://localhost:8080/api/bookings";

export async function createBooking({ userId, productId, dateStr, passengers }) {

  // Convertir ISO → dd/MM/yyyy si viene con T
  let formateada = dateStr;
  if (dateStr.includes("T")) {
    formateada = new Date(dateStr).toLocaleDateString("es-AR");
  }

  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      productId,
      dateStr: formateada,
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
