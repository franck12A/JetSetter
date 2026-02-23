package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.resources.FlightOfferSearch;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;


import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController.IMAGENES_POR_PAIS;
import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController.PAIS_POR_IATA;

@Service
public class AmadeusService {

    private final Amadeus amadeus;
    private final RestTemplate restTemplate;
    private final Map<String, String> cachePaises = new ConcurrentHashMap<>();
    private final ProductRepository productRepository;

    private final String clientId;
    private final String clientSecret;

    private String accessToken;
    private Instant tokenExpiration;

    public AmadeusService(
            @Value("${amadeus.client.id}") String clientId,
            @Value("${amadeus.client.secret}") String clientSecret,
            RestTemplate restTemplate,
            ProductRepository productRepository
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restTemplate = restTemplate;
        this.productRepository = productRepository;

        this.amadeus = Amadeus.builder(clientId, clientSecret).build();
    }

    public Amadeus getClient() {
        return amadeus;
    }

    // ========================================================
    // TOKEN
    // ========================================================
    public String obtenerTokenValido() {
        if (accessToken != null && tokenExpiration != null && Instant.now().isBefore(tokenExpiration)) {
            return accessToken;
        }

        String url = "https://test.api.amadeus.com/v1/security/oauth2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                System.out.println("❌ Error token HTTP: " + response.getStatusCode());
                return null;
            }

            Map<String, Object> json = response.getBody();
            this.accessToken = (String) json.get("access_token");
            int expiresIn = (int) json.get("expires_in");
            this.tokenExpiration = Instant.now().plusSeconds(expiresIn - 30);

            System.out.println("✔ Nuevo token Amadeus obtenido");
            return accessToken;

        } catch (Exception e) {
            System.out.println("❌ Error obteniendo token: " + e.getMessage());
            return null;
        }
    }


    public List<FlightOfferDTO> obtenerVuelos() {
        try {
            FlightOfferSearch[] resultado = amadeus.shopping.flightOffersSearch.get(
                    Params.with("originLocationCode", "EZE")
                            .and("destinationLocationCode", "MAD")
                            .and("departureDate", "2025-12-20")
                            .and("adults", 1)
                            .and("max", 20)
            );

            List<FlightOfferDTO> vuelos = new ArrayList<>();

            for (FlightOfferSearch offer : resultado) {
                FlightOfferDTO dto = mapear(offer);
                vuelos.add(dto);
            }

            return vuelos;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al consultar vuelos en Amadeus", e);
        }
    }


    private FlightOfferDTO mapear(FlightOfferSearch offer) {
        FlightOfferDTO dto = new FlightOfferDTO();

        dto.setId(offer.getId());
        dto.setOrigen(offer.getItineraries()[0].getSegments()[0].getDeparture().getIataCode());
        dto.setDestino(offer.getItineraries()[0].getSegments()[0].getArrival().getIataCode());
        dto.setFechaSalida(offer.getItineraries()[0].getSegments()[0].getDeparture().getAt());
        dto.setFechaLlegada(offer.getItineraries()[0].getSegments()[0].getArrival().getAt());



        return dto;
    }



    public Product convertToProduct(FlightOfferDTO dto) {

        // 1️⃣ Buscar si ya existe en la BD
        var existing = productRepository.findByExternalId(dto.getId());
        if (existing.isPresent()) {
            return existing.get();  // listo, reutilizalo
        }

        // 2️⃣ Crear uno nuevo si no existe
        Product product = new Product();
        product.setExternalId(dto.getId());  // clave
        product.setName("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());
        product.setDescription("Vuelo importado desde Amadeus");
        product.setPrice(dto.getPrecioTotal());
        product.setCountry(dto.getPaisDestino());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
        product.setDepartureDate(LocalDateTime.parse(dto.getFechaSalida(), formatter));


        // imágenes, features y category no aplican
        product.setImage(null);

        return productRepository.save(product);
    }



    // ========================================================
    // BUSCAR VUELOS → devuelve List<FlightOfferSearch>
    // ========================================================
    public List<FlightOfferDTO> buscarVuelos(String origen, String destino, String fecha) throws Exception {

        if (origen == null || destino == null || fecha == null)
            throw new IllegalArgumentException("Datos incompletos para buscar vuelos.");

        String o = origen.trim().toUpperCase();
        String d = destino.trim().toUpperCase();
        LocalDate fechaLocal;

        try {
            fechaLocal = LocalDate.parse(fecha.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha inválido. Debe ser yyyy-MM-dd", e);
        }

        obtenerTokenValido();

        FlightOfferSearch[] results = amadeus.shopping.flightOffersSearch.get(
                Params.with("originLocationCode", o)
                        .and("destinationLocationCode", d)
                        .and("departureDate", fechaLocal.toString())
                        .and("adults", 1)
                        .and("max", 20)
        );

        List<FlightOfferDTO> lista = new ArrayList<>();

        if (results == null) return lista;

        for (FlightOfferSearch f : results) {
            FlightOfferDTO dto = convertirAFlightOfferDTO(f);
            lista.add(dto);
        }


        return lista;
    }

    public Product mapToProduct(FlightOfferDTO dto) {

        Product p = new Product();

        // ID externo desde Amadeus
        p.setExternalId(dto.getId());

        // Nombre: lo armamos porque tu DTO no tiene nombre
        p.setName("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());

        // País destino
        p.setCountry(dto.getPaisDestino());

        // Descripción inventada (tu DTO no tiene descripción)
        p.setDescription("Vuelo operado por " + dto.getAerolinea() +
                " número " + dto.getNumeroVuelo());

        // Precio real
        p.setPrice(dto.getPrecioTotal());

        // Imagen
        p.setImage(dto.getImagenPrincipal());

        // Fecha salida: convertir string → LocalDateTime
        if (dto.getFechaSalida() != null) {
            p.setDepartureDate(LocalDateTime.parse(dto.getFechaSalida() + "T00:00:00"));
        }

        return p;
    }


    public Product saveOrGetExisting(FlightOfferDTO dto) {
        Optional<Product> existing = productRepository.findByExternalId(dto.getId());

        if (existing.isPresent()) {
            System.out.println("Ya existe en BD: externalId=" + dto.getId() + " -> id numérico=" + existing.get().getId());
            return existing.get();
        }

        Product p = mapToProduct(dto);
        Product saved = productRepository.save(p);
        System.out.println("Se guardó nuevo Product: externalId=" + dto.getId() + " -> id numérico=" + saved.getId());
        return saved;
    }








    // ========================================================
    // IATA → PAÍS
    // ========================================================
    public String getCountryByIATA(String iataCode) {

        if (iataCode == null || iataCode.isBlank()) return null;

        iataCode = iataCode.trim().toUpperCase();

        if (cachePaises.containsKey(iataCode)) {
            return cachePaises.get(iataCode);
        }

        String token = obtenerTokenValido();
        if (token == null) return null;

        String url = "https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY&keyword=" + iataCode;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) return null;

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("data")) return null;

            var dataList = (List<?>) body.get("data");
            if (dataList == null || dataList.isEmpty()) return null;

            var location = (Map<?, ?>) dataList.get(0);
            var address = (Map<?, ?>) location.get("address");
            if (address == null) return null;

            String country = address.get("countryCode").toString();
            cachePaises.put(iataCode, country);
            return country;

        } catch (Exception e) {
            System.out.println("❌ Error país " + iataCode + ": " + e.getMessage());
            return null;
        }
    }

    @Autowired
    private AmadeusProductMapperService mapperService;




    // ========================================================
// Método premium → Devuelve List<FlightOfferDTO> listos para mostrar en frontend
// ========================================================

    // Mapa IATA -> nombre legible del país
    public static final Map<String, String> NOMBRES_PAISES = Map.ofEntries(
            Map.entry("ARG", "Argentina"),
            Map.entry("AUS", "Australia"),
            Map.entry("BEL", "Bélgica"),
            Map.entry("BRA", "Brasil"),
            Map.entry("CAN", "Canadá"),
            Map.entry("CHN", "China"),
            Map.entry("ARE", "Dubai"),
            Map.entry("EGY", "Egipto"),
            Map.entry("FRA", "Francia"),
            Map.entry("DEU", "Alemania"),
            Map.entry("GRC", "Grecia"),
            Map.entry("NLD", "Países Bajos"),
            Map.entry("IND", "India"),
            Map.entry("ITA", "Italia"),
            Map.entry("JPN", "Japón"),
            Map.entry("GBR", "Reino Unido"),
            Map.entry("MEX", "México"),
            Map.entry("USA", "Estados Unidos"),
            Map.entry("NOR", "Noruega"),
            Map.entry("PRT", "Portugal"),
            Map.entry("RUS", "Rusia"),
            Map.entry("ZAF", "Sudáfrica"),
            Map.entry("ESP", "España"),
            Map.entry("SWE", "Suecia"),
            Map.entry("CHE", "Suiza"),
            Map.entry("THA", "Tailandia"),
            Map.entry("TUR", "Turquía")
    );
    public static final Map<String, List<String>> IMAGENES_POR_PAIS = Map.ofEntries(
            Map.entry("ARG", List.of("argentina_1.jpg", "argentina_2.jpg")),
            Map.entry("AUS", List.of("australia_1.jpg", "australia_2.jpg")),
            Map.entry("BEL", List.of("belgica_1.jpg", "belgica_2.jpg")),
            Map.entry("BRA", List.of("brazil_1.jpg", "brazil_2.jpg")),
            Map.entry("CAN", List.of("canada_1.jpg", "canada_2.jpg")),
            Map.entry("CHN", List.of("china_1.jpg", "china_2.jpg")),
            Map.entry("ARE", List.of("dubai_1.jpg", "dubai_2.jpg")),
            Map.entry("EGY", List.of("egipto_1.jpg", "egipto_2.jpg")),
            Map.entry("FRA", List.of("france_1.webp", "france_2.webp")),
            Map.entry("DEU", List.of("germany_1.jpg", "germany_2.jpg")),
            Map.entry("GRC", List.of("grecia_1.jpg", "grecia_2.jpg")),
            Map.entry("NLD", List.of("holanda_1.jpg", "holanda_2.jpg")),
            Map.entry("IND", List.of("india_1.jpg", "india_2.jpg")),
            Map.entry("ITA", List.of("italy_1.webp", "italy_2.jpg")),
            Map.entry("JPN", List.of("japon_1.jpg", "japon_2.jpg")),
            Map.entry("GBR", List.of("london_1.jpg", "london_2.jpg")),
            Map.entry("MEX", List.of("mexico_1.jpg", "mexico_2.jpg")),
            Map.entry("USA", List.of("newyork_1.jpg", "newyork_2.jpg")),
            Map.entry("NOR", List.of("Norway_1.jpg", "Norway_2.jpg")),
            Map.entry("PRT", List.of("portugal_1.jpg", "portugal_2.jpg")),
            Map.entry("RUS", List.of("russia_1.jpg", "russia_2.jpg")),
            Map.entry("ZAF", List.of("southafrica_1.jpg", "southafrica_2.jpg")),
            Map.entry("ESP", List.of("spain_1.jpg", "spai_2.jpg")),
            Map.entry("SWE", List.of("Sweden_1.jpg", "Sweden_2.jpg")),
            Map.entry("CHE", List.of("Switzerland_1.jpg", "Switzerland_2.jpg")),
            Map.entry("THA", List.of("tailanda_2.jpg", "tailandia_1.jpg")),
            Map.entry("TUR", List.of("turkia_1.jpg", "turkia_2.jpg"))
    );


    // ===================================
// Método de conversión de Amadeus
// ===================================
    public FlightOfferDTO convertirAFlightOfferDTO(FlightOfferSearch vuelo) {
        FlightOfferDTO dto = new FlightOfferDTO();

        // 🔹 ID
        dto.setId(UUID.randomUUID().toString());

// 🔹 Origen y Destino (IATA)
        String origenIATA = vuelo.getItineraries()[0].getSegments()[0].getDeparture().getIataCode();
        String destinoIATA = vuelo.getItineraries()[0].getSegments()[0].getArrival().getIataCode();
        dto.setOrigen(origenIATA);
        dto.setDestino(destinoIATA);

// 🔹 País legible y código ISO del destino
        String paisDestinoLegible = AmadeusService.NOMBRES_PAISES.getOrDefault(destinoIATA, "Desconocido");
        dto.setPaisDestino(paisDestinoLegible);
        dto.setCountry(destinoIATA);

// 🔹 País legible y carpeta de imágenes del origen
        String paisOrigenLegible = AmadeusService.NOMBRES_PAISES.getOrDefault(origenIATA, "Desconocido");
        List<String> imgsOrigen = AmadeusService.IMAGENES_POR_PAIS.getOrDefault(origenIATA,
                List.of("default_1.jpg", "default_2.jpg"));
        dto.setImagenPrincipal("/assets/imagenespaises/" + imgsOrigen.get(0));
        dto.setImagenesPais(imgsOrigen.stream().map(f -> "/assets/imagenespaises/" + f).toList());
        dto.setImagenesUrls(imgsOrigen.stream().map(f -> "/assets/imagenespaises/" + f).toList());


        // 🔹 Segmentos y fechas
        List<Map<String, Object>> segmentos = new ArrayList<>();
        long duracionTotalMinutos = 0;
        String fechaSalidaPrimera = null;
        String fechaLlegadaUltima = null;
        String aerolineaPrincipal = null;
        String numeroVueloPrincipal = null;

        if (vuelo.getItineraries() != null) {
            for (var itinerary : vuelo.getItineraries()) {
                for (var seg : itinerary.getSegments()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("aerolinea", seg.getCarrierCode());
                    m.put("numeroVuelo", seg.getNumber());

                    LocalDateTime salida = LocalDateTime.parse(seg.getDeparture().getAt());
                    LocalDateTime llegada = LocalDateTime.parse(seg.getArrival().getAt());

                    m.put("salida", salida);
                    m.put("llegada", llegada);

                    long duracionMin = Duration.between(salida, llegada).toMinutes();
                    duracionTotalMinutos += duracionMin;
                    m.put("duracion", duracionMin + " min");

                    if (fechaSalidaPrimera == null) {
                        fechaSalidaPrimera = salida.toString();
                        aerolineaPrincipal = seg.getCarrierCode();
                        numeroVueloPrincipal = seg.getNumber();
                    }
                    fechaLlegadaUltima = llegada.toString();
                    segmentos.add(m);
                }
            }
        }

        dto.setSegmentos(segmentos);
        dto.setFechaSalida(fechaSalidaPrimera);
        dto.setFechaLlegada(fechaLlegadaUltima);
        dto.setAerolinea(aerolineaPrincipal);
        dto.setNumeroVuelo(numeroVueloPrincipal);

        // 🔹 Precio
        try {
            dto.setPrecioTotal(Math.round(Double.parseDouble(vuelo.getPrice().getTotal()) * 100.0) / 100.0);
        } catch (Exception e) {
            dto.setPrecioTotal(0);
        }

        // 🔹 Características
        List<String> caracteristicas = new ArrayList<>();
        caracteristicas.add("Duración total: " + (duracionTotalMinutos / 60) + "h " + (duracionTotalMinutos % 60) + "m");
        caracteristicas.add("Clase: Economy");
        caracteristicas.add("Equipaje incluido: No");
        dto.setCaracteristicas(caracteristicas);

        return dto;
    }










    // ========================================================
// CONVERTIR DTO → PRODUCT (sin guardar todavía)
// ========================================================
    public Product fromFlightOfferDTO(FlightOfferDTO dto) {
        Product product = new Product();

        // 🔹 ID externo
        product.setExternalId(dto.getId());

        // 🔹 Nombre del vuelo
        product.setName("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());

        // 🔹 Descripción
        String desc = "Aerolínea: " + dto.getAerolinea() +
                " | Vuelo: " + dto.getNumeroVuelo() +
                " | Salida: " + dto.getFechaSalida() +
                " | Llegada: " + dto.getFechaLlegada();
        product.setDescription(desc);

        // 🔹 País destino
        product.setCountry(dto.getPaisDestino());

        // 🔹 Aerolínea y número de vuelo
        product.setAerolinea(dto.getAerolinea());
        product.setNumeroVuelo(dto.getNumeroVuelo());

        // 🔹 Fecha de salida
        if (dto.getFechaSalida() != null) {
            try {
                String fecha = dto.getFechaSalida();
                DateTimeFormatter formatter;
                if (fecha.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                    product.setDepartureDate(LocalDate.parse(fecha, formatter).atStartOfDay());
                } else if (fecha.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}")) {
                    formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
                    product.setDepartureDate(LocalDateTime.parse(fecha, formatter));
                } else {
                    formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                    product.setDepartureDate(LocalDateTime.parse(fecha, formatter));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // 🔹 Imagen principal
        product.setImage(dto.getImagenPrincipal());

        // 🔹 Precio
        product.setPrice(dto.getPrecioTotal());

        // 🔹 Características → Features
        if (dto.getCaracteristicas() != null) {
            Set<Feature> features = dto.getCaracteristicas().stream()
                    .map(name -> {
                        Feature f = new Feature();
                        f.setName(name);
                        return f;
                    })
                    .collect(Collectors.toSet());
            product.setFeatures(features);
        }

        // 🔹 Categoría → Category
        if (dto.getCategorias() != null && !dto.getCategorias().isEmpty()) {
            Category cat = new Category();
            cat.setName(dto.getCategorias().get(0)); // solo la primera categoría
            product.setCategory(cat);
        }

        // 🔹 Segmentos e imágenes como JSON
        try {
            ObjectMapper mapper = new ObjectMapper();
            if (dto.getSegmentos() != null) {
                product.setSegmentosJson(mapper.writeValueAsString(dto.getSegmentos()));
            }
            if (dto.getImagenesUrls() != null) {
                product.setImagenesUrlsJson(mapper.writeValueAsString(dto.getImagenesUrls()));
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        return product;
    }






    // ========================================================
// GUARDAR SI NO EXISTE (por externalId)
// ========================================================
    public Product saveIfNotExists(Product product) {
        Optional<Product> existing = productRepository.findByExternalId(product.getExternalId());

        return existing.orElseGet(() -> productRepository.save(product));
    }


    // ========================================================
// PROCESAR Y GUARDAR AUTOMÁTICAMENTE LOS VUELOS DE AMADEUS
// ========================================================
    public List<Product> buscarYGuardarVuelos(String origen, String destino, String fecha) throws Exception {

        List<FlightOfferDTO> dtos = buscarVuelos(origen, destino, fecha);

        List<Product> productos = new ArrayList<>();

        for (FlightOfferDTO dto : dtos) {
            Product p = mapToProduct(dto);
            productRepository.save(p);
            productos.add(p);
        }

        return productos; // ➜ ahora devolvés productos con ID numérico
    }













}
