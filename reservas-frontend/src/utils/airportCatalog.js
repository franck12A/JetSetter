export const AIRPORTS = [
  { city: "Buenos Aires", iata: "EZE" },
  { city: "Barcelona", iata: "BCN" },
  { city: "Londres", iata: "LHR" },
  { city: "Los Angeles", iata: "LAX" },
  { city: "Madrid", iata: "MAD" },
  { city: "Milán", iata: "MXP" },
  { city: "Nueva York", iata: "JFK" },
  { city: "Paris", iata: "CDG" },
  { city: "Roma", iata: "FCO" },
  { city: "Sao Paulo", iata: "GRU" },
  { city: "San Francisco", iata: "SFO" },
  { city: "Tokio", iata: "NRT" },
];

const cityToIata = new Map(
  AIRPORTS.flatMap(({ city, iata }) => [
    [city.toLowerCase(), iata],
    [iata.toLowerCase(), iata],
  ])
);

export const getIataForCity = (city) => cityToIata.get(String(city || "").trim().toLowerCase()) || "";