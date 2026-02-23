import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: import.meta.env.VITE_AMADEUS_API_KEY,
  clientSecret: import.meta.env.VITE_AMADEUS_API_SECRET,
});

export async function buscarAeropuertos(keyword) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: "AIRPORT",
    });

    return response.data.map(a => ({
      code: a.iataCode,
      name: a.name,
      city: a.address.cityName,
      country: a.address.countryName,
    }));

  } catch (error) {
    console.error("Error aeropuertos:", error);
    return [];
  }
}
