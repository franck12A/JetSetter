import express from "express";
import Amadeus from "amadeus";

const router = express.Router();

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
});

// /api/amadeus/vuelos?origen=EZE&destino=MAD&fecha=2025-06-01
router.get("/vuelos", async (req, res) => {
  const { origen, destino, fecha } = req.query;

  if (!origen || !destino || !fecha) {
    return res.status(400).json({ error: "Falta origen/destino/fecha" });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origen,
      destinationLocationCode: destino,
      departureDate: fecha,
      adults: 1,
      max: 10,
    });

    const normalizados = response.data.map((f, i) => ({
      id: `amadeus-${i}-${Date.now()}`,
      name: `${origen} - ${destino}`,
      departureDate: fecha,
      price: f.price.total,
      category: "Internacional",
      description: "Vuelo obtenido desde Amadeus",
      imageUrl: null,
      raw: f,
    }));

    res.json(normalizados);
  } catch (err) {
    console.error("Amadeus error:", err);
    res.status(500).json({ error: "Error al obtener vuelos de Amadeus" });
  }
});

export default router;
