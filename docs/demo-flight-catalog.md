# Catalogo de vuelos demo

El endpoint `GET /api/flights/demo` construye sus rutas desde
`DemoDestinationCatalog`. El catalogo contiene el origen `EZE` y los destinos
demo; `MockFlightProvider` crea automaticamente una ruta desde EZE hacia cada
destino distinto.

Para agregar un destino:

1. Agregar una entrada con IATA, nombre de aeropuerto, ciudad, pais y codigo ISO de dos letras en `DemoDestinationCatalog`.
2. Verificar que el aeropuerto y el codigo IATA sean reales.
3. No modificar `Home.jsx`, `Recomendaciones.jsx`, `Resultados.jsx` ni la logica de imagenes.

El backend entrega la metadata geografica completa. El frontend usa ciudad y
pais para la presentacion y conserva el IATA para busquedas y contratos
tecnicos. Las imagenes se consultan desde backend, se cachean por destino y
caen primero al recurso local del pais y luego a `/assets/avionsito.png`.