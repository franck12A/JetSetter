package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller;

import com.amadeus.resources.FlightOfferSearch;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.support.FlightIdentityUtils;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.ProductService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/amadeus")
public class AmadeusController {

    private final AmadeusService service;
    private final ProductService productService;

    // Cache de DTOs por ID

    private final Map<String, FlightOfferDTO> vuelosCache = new HashMap<>();

    public AmadeusController(AmadeusService service,  ProductService productService) {
        this.service = service;
        this.productService = productService;

    }

    private static final List<String> CATEGORIAS = List.of(
            "Economy", "Premium Economy", "Lite", "Executive"
    );

    private String buildFlightSeed(Object... parts) {
        return Arrays.stream(parts)
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.joining("|"));
    }

    private List<Map<String, Object>> normalizeSegments(List<Map<String, Object>> segmentos, String seed) {
        return FlightIdentityUtils.normalizeSegments(segmentos, seed);
    }

    public static final Map<String, Map<String, Object>> AEROPUERTOS = Map.ofEntries(
            Map.entry("EZE", Map.of(
                    "nombre", "Aeropuerto Internacional Ministro Pistarini",
                    "ciudad", "Buenos Aires",
                    "pais", "ARG"
            )),
            Map.entry("AEP", Map.of(
                    "nombre", "Aeroparque Jorge Newbery",
                    "ciudad", "Buenos Aires",
                    "pais", "ARG"
            )),
            Map.entry("CDG", Map.of(
                    "nombre", "Aeropuerto Charles de Gaulle",
                    "ciudad", "París",
                    "pais", "FRA"
            )),
            Map.entry("ORY", Map.of(
                    "nombre", "Aeropuerto de Orly",
                    "ciudad", "París",
                    "pais", "FRA"
            )),
            Map.entry("JFK", Map.of(
                    "nombre", "Aeropuerto John F. Kennedy",
                    "ciudad", "Nueva York",
                    "pais", "USA"
            )),
            Map.entry("LGA", Map.of(
                    "nombre", "Aeropuerto LaGuardia",
                    "ciudad", "Nueva York",
                    "pais", "USA"
            )),
            Map.entry("NRT", Map.of(
                    "nombre", "Aeropuerto de Narita",
                    "ciudad", "Tokio",
                    "pais", "JPN"
            )),
            Map.entry("HND", Map.of(
                    "nombre", "Aeropuerto de Haneda",
                    "ciudad", "Tokio",
                    "pais", "JPN"
            )),
            Map.entry("GRU", Map.of(
                    "nombre", "Aeropuerto Internacional de São Paulo-Guarulhos",
                    "ciudad", "São Paulo",
                    "pais", "BRA"
            )),
            Map.entry("YVR", Map.of(
                    "nombre", "Aeropuerto Internacional de Vancouver",
                    "ciudad", "Vancouver",
                    "pais", "CAN"
            )),
            Map.entry("SYD", Map.of(
                    "nombre", "Aeropuerto de Sídney",
                    "ciudad", "Sídney",
                    "pais", "AUS"
            )),
            Map.entry("BKK", Map.of(
                    "nombre", "Aeropuerto Suvarnabhumi",
                    "ciudad", "Bangkok",
                    "pais", "THA"
            )),
            Map.entry("DXB", Map.of(
                    "nombre", "Aeropuerto Internacional de Dubái",
                    "ciudad", "Dubái",
                    "pais", "ARE"
            )),
            Map.entry("FRA", Map.of(
                    "nombre", "Aeropuerto de Frankfurt",
                    "ciudad", "Fráncfort",
                    "pais", "DEU"
            )),
            Map.entry("MXP", Map.of(
                    "nombre", "Aeropuerto de Milán-Malpensa",
                    "ciudad", "Milán",
                    "pais", "ITA"
            )),
            Map.entry("LHR", Map.of(
                    "nombre", "Aeropuerto de Londres-Heathrow",
                    "ciudad", "Londres",
                    "pais", "GBR"
            )),
            Map.entry("AMS", Map.of(
                    "nombre", "Aeropuerto de Ámsterdam-Schiphol",
                    "ciudad", "Ámsterdam",
                    "pais", "NLD"
            )),
            Map.entry("BCN", Map.of(
                    "nombre", "Aeropuerto de Barcelona-El Prat",
                    "ciudad", "Barcelona",
                    "pais", "ESP"
            )),
            Map.entry("MAD", Map.of(
                    "nombre", "Aeropuerto Adolfo Suárez Madrid-Barajas",
                    "ciudad", "Madrid",
                    "pais", "ESP"
            )),
            Map.entry("OSL", Map.of(
                    "nombre", "Aeropuerto de Oslo-Gardermoen",
                    "ciudad", "Oslo",
                    "pais", "NOR"
            )),
            Map.entry("ZRH", Map.of(
                    "nombre", "Aeropuerto de Zúrich",
                    "ciudad", "Zúrich",
                    "pais", "CHE"
            ))
            // Agregá más aeropuertos según necesites
    );




    private String resolveIataCode(String rawLocation) {
        if (rawLocation == null || rawLocation.isBlank()) return null;

        String trimmed = rawLocation.trim();
        String normalizedCode = trimmed.toUpperCase();
        if (AEROPUERTOS.containsKey(normalizedCode)) return normalizedCode;

        return AEROPUERTOS.entrySet().stream()
                .filter(e -> {
                    String ciudad = String.valueOf(e.getValue().getOrDefault("ciudad", ""));
                    String nombre = String.valueOf(e.getValue().getOrDefault("nombre", ""));
                    return ciudad.equalsIgnoreCase(trimmed) || nombre.equalsIgnoreCase(trimmed);
                })
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(normalizedCode);
    }

    private String getDisplayLocation(String iataCode) {
        Map<String, Object> info = AEROPUERTOS.get(iataCode);
        if (info == null) return iataCode;
        String ciudad = String.valueOf(info.getOrDefault("ciudad", ""));
        if (!ciudad.isBlank()) return ciudad;
        return String.valueOf(info.getOrDefault("nombre", iataCode));
    }

    private String normalizeLocationLabel(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) return "Desconocido";
        String clean = rawValue.replaceFirst("(?i)^Vuelo\\s+", "").trim();
        String resolvedIata = resolveIataCode(clean);
        if (resolvedIata != null && AEROPUERTOS.containsKey(resolvedIata)) {
            return getDisplayLocation(resolvedIata);
        }
        return clean;
    }


    // Mapa de IATA -> carpeta imagen
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

    // Mapa de código IATA de país -> nombre completo del país
    public static final Map<String, String> PAIS_POR_IATA = Map.ofEntries(
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
            Map.entry("NLD", "Holanda"),
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





    // Genera un vuelo simulado según destino
    private FlightOfferDTO generarVueloPorDestino(String id, String origen, String destino) {
        FlightOfferDTO vuelo = new FlightOfferDTO();
        vuelo.setId(id);
        vuelo.setOrigen(getDisplayLocation(resolveIataCode(origen != null ? origen : "EZE")));
        vuelo.setDestino(getDisplayLocation(resolveIataCode(destino != null ? destino : "CDG")));
        vuelo.setPaisDestino(destino != null ? destino : "FR");

        // Imagen según destino
        String codigo = (destino != null) ? destino.toUpperCase() : "FR";
        List<String> imgs = IMAGENES_POR_PAIS.getOrDefault(codigo, List.of("default.jpg"));
        vuelo.setImagenPrincipal("/assets/imagenespaises/" + imgs.get(0));


        // Precio aleatorio
        double precio = 400 + new Random().nextDouble() * 500;
        vuelo.setPrecioTotal(Math.round(precio * 100.0) / 100.0);

        // Características
        vuelo.setCaracteristicas(List.of(
                "Duración aproximada: " + (8 + new Random().nextInt(5)) + "h " + (10 + new Random().nextInt(50)) + "m",
                "Clase: Economy",
                "Equipaje incluido: Sí"
        ));
        if (vuelo.getCaracteristicas() != null && !vuelo.getCaracteristicas().isEmpty()) {
            List<String> caracteristicasExtra = new ArrayList<>(vuelo.getCaracteristicas());
            caracteristicasExtra.add("Escalas: Directo");
            vuelo.setCaracteristicas(caracteristicasExtra);
        }
        vuelo.setCategoria("Internacional");

        String baseSeed = buildFlightSeed("destino", id, origen, destino);
        FlightIdentityUtils.FlightIdentity mainIdentity = FlightIdentityUtils.resolve(null, null, null, baseSeed);
        FlightIdentityUtils.FlightIdentity connectionIdentity = FlightIdentityUtils.resolve(
                mainIdentity.getCarrierCode(),
                mainIdentity.getAirlineName(),
                null,
                baseSeed + "|connection"
        );
        vuelo.setAerolinea(mainIdentity.getAirlineName());
        vuelo.setNumeroVuelo(mainIdentity.getFlightNumber());

        // Segmentos simulados
        List<Map<String, Object>> segmentos = new ArrayList<>();
        Map<String, Object> s1 = new HashMap<>();
        s1.put("codigoAerolinea", mainIdentity.getCarrierCode());
        s1.put("aerolinea", mainIdentity.getAirlineName());
        s1.put("numeroVuelo", mainIdentity.getFlightNumber());
        s1.put("salida", "2025-12-05T23:55:00");
        s1.put("llegada", "2025-12-06T07:10:00");

        Map<String, Object> s2 = new HashMap<>();
        s2.put("codigoAerolinea", connectionIdentity.getCarrierCode());
        s2.put("aerolinea", connectionIdentity.getAirlineName());
        s2.put("numeroVuelo", connectionIdentity.getFlightNumber());
        s2.put("salida", "2025-12-06T09:34:00");
        s2.put("llegada", "2025-12-06T14:00:00");

        segmentos.add(s1);
        segmentos.add(s2);

        vuelo.setSegmentos(segmentos);

        return vuelo;
    }


    // Método helper que genera datos “reales”
    private FlightOfferDTO generarVueloSimulado(String id) {
        FlightOfferDTO vuelo = new FlightOfferDTO();
        vuelo.setId(id);
        vuelo.setOrigen(getDisplayLocation("EZE"));
        vuelo.setDestino(getDisplayLocation("CDG"));
        vuelo.setPaisDestino("FR");
        vuelo.setPrecioTotal(683.18);
        vuelo.setCategoria("Internacional");
        vuelo.setCaracteristicas(List.of("Duración aproximada: 12h 35m", "Clase: Economy", "Equipaje incluido: Sí"));

        String baseSeed = buildFlightSeed("simulado", id, vuelo.getOrigen(), vuelo.getDestino());
        FlightIdentityUtils.FlightIdentity mainIdentity = FlightIdentityUtils.resolve(null, null, null, baseSeed);
        FlightIdentityUtils.FlightIdentity connectionIdentity = FlightIdentityUtils.resolve(
                mainIdentity.getCarrierCode(),
                mainIdentity.getAirlineName(),
                null,
                baseSeed + "|connection"
        );
        vuelo.setAerolinea(mainIdentity.getAirlineName());
        vuelo.setNumeroVuelo(mainIdentity.getFlightNumber());

        // Imagen principal
        vuelo.setImagenPrincipal("/assets/imagenespaises/france_1.webp");

        // Segmentos
        List<Map<String, Object>> segmentos = new ArrayList<>();

        Map<String, Object> s1 = new HashMap<>();
        s1.put("codigoAerolinea", mainIdentity.getCarrierCode());
        s1.put("aerolinea", mainIdentity.getAirlineName());
        s1.put("numeroVuelo", mainIdentity.getFlightNumber());
        s1.put("salida", "2025-12-05T23:55:00");
        s1.put("llegada", "2025-12-06T07:10:00");

        Map<String, Object> s2 = new HashMap<>();
        s2.put("codigoAerolinea", connectionIdentity.getCarrierCode());
        s2.put("aerolinea", connectionIdentity.getAirlineName());
        s2.put("numeroVuelo", connectionIdentity.getFlightNumber());
        s2.put("salida", "2025-12-06T09:34:00");
        s2.put("llegada", "2025-12-06T14:00:00");

        segmentos.add(s1);
        segmentos.add(s2);

        vuelo.setSegmentos(segmentos);

        return vuelo;
    }


    // ============================
// ENDPOINT /buscar
// ============================
    @GetMapping("/buscar")
    public List<FlightOfferDTO> buscarVuelos(
            @RequestParam(required = false) String origen,
            @RequestParam(required = false) String destino,
            @RequestParam(required = false) String fecha,
            @RequestParam(defaultValue = "20") int limit
    ) {
        Random random = new Random();

        int cantidadVuelos = Math.max(1, Math.min(limit, 50));
        String origenSeguro = resolveIataCode(origen);
        String destinoSeguro = resolveIataCode(destino);

        if (origenSeguro != null && !AEROPUERTOS.containsKey(origenSeguro)) {
            origenSeguro = null;
        }
        if (destinoSeguro != null && !AEROPUERTOS.containsKey(destinoSeguro)) {
            destinoSeguro = null;
        }
        LocalDate fechaBase = null;
        if (fecha != null && !fecha.isBlank()) {
            try {
                fechaBase = LocalDate.parse(fecha.trim());
            } catch (Exception ignored) {
                fechaBase = LocalDate.now().plusDays(7);
            }
        }
        productService.cleanupSimulatedProducts(10, 500);

        List<String> aeropuertos = new ArrayList<>(AEROPUERTOS.keySet());
        if (aeropuertos.size() < 2) return List.of();

        List<FlightOfferDTO> vuelos = new ArrayList<>();

        for (int i = 0; i < cantidadVuelos; i++) {

            String origenLoop = origenSeguro != null ? origenSeguro : aeropuertos.get(random.nextInt(aeropuertos.size()));
            String destinoLoop = destinoSeguro != null ? destinoSeguro : aeropuertos.get(random.nextInt(aeropuertos.size()));
            while (destinoLoop.equals(origenLoop)) {
                destinoLoop = aeropuertos.get(random.nextInt(aeropuertos.size()));
            }

            boolean isReturn = random.nextDouble() < 0.35;
            if (isReturn && origenSeguro != null && destinoSeguro != null) {
                String temp = origenLoop;
                origenLoop = destinoLoop;
                destinoLoop = temp;
            }

            FlightOfferDTO dto = new FlightOfferDTO();

            // ID único
            LocalDate fechaVuelo = fechaBase != null
                    ? fechaBase
                    : LocalDate.now().plusDays(1 + random.nextInt(180));
            if (isReturn) {
                fechaVuelo = fechaVuelo.plusDays(2 + random.nextInt(15));
            }
            String fechaSegura = fechaVuelo.toString();

            String externalId = origenLoop + "-" + destinoLoop + "-" + fechaSegura + "-" + i;
            dto.setId(externalId);

            // Origen y destino
            dto.setOrigen(getDisplayLocation(origenLoop));
            dto.setDestino(getDisplayLocation(destinoLoop));

            // País destino
            String codigoPaisDestino = String.valueOf(
                    AEROPUERTOS.getOrDefault(destinoLoop, Map.of("pais", "ARG")).get("pais")
            );
            dto.setPaisDestino(PAIS_POR_IATA.getOrDefault(codigoPaisDestino, "Desconocido"));
            dto.setCountry(codigoPaisDestino);

            // Imágenes país
            List<String> imgs = AmadeusController.IMAGENES_POR_PAIS.getOrDefault(codigoPaisDestino, List.of("argentina_1.jpg"));
            List<String> imagenesPaisList = imgs.stream()
                    .map(img -> "/assets/imagenespaises/" + img)
                    .collect(Collectors.toList());
            dto.setImagenesPais(imagenesPaisList);
            dto.setImagenPrincipal(!imagenesPaisList.isEmpty() ? imagenesPaisList.get(0) :
                    "https://via.placeholder.com/400x300?text=Sin+Imagen");

            // Precio y características
            double precio = 300 + random.nextDouble() * 900;
            dto.setPrecioTotal(Math.round(precio * 100.0) / 100.0);

            List<String> caracteristicas = new ArrayList<>();
            caracteristicas.add("Duracion aproximada: " + (8 + random.nextInt(5)) + "h " + (10 + random.nextInt(50)) + "m");
            caracteristicas.add("Clase: " + CATEGORIAS.get(random.nextInt(CATEGORIAS.size())));
            caracteristicas.add("Equipaje incluido: " + (random.nextBoolean() ? "Si" : "No"));
            if (isReturn) {
                caracteristicas.add("Tipo: Regreso");
            }
            dto.setCaracteristicas(caracteristicas);

            dto.setCategoria(isReturn ? "Regreso" : "Internacional");

            /*
            dto.setCaracteristicas(List.of(
                    "Duración aproximada: " + (8 + random.nextInt(5)) + "h " + (10 + random.nextInt(50)) + "m",
                    "Clase: " + CATEGORIAS.get(random.nextInt(CATEGORIAS.size())),
                    "Equipaje incluido: " + (random.nextBoolean() ? "Sí" : "No")
            ));

            dto.setCategoria("Internacional");
            */

            // **Fechas directamente en DTO**
            int horaSalida = random.nextInt(0, 24);
            int minutoSalida = random.nextInt(0, 6) * 10;
            int duracionHoras = 2 + random.nextInt(12);
            int horaLlegada = (horaSalida + duracionHoras) % 24;
            dto.setFechaSalida(fechaSegura + "T" + String.format("%02d:%02d:00", horaSalida, minutoSalida));
            dto.setFechaLlegada(fechaSegura + "T" + String.format("%02d:%02d:00", horaLlegada, minutoSalida));

            // Segmento opcional (solo uno representativo)
            Map<String, Object> seg = new HashMap<>();
            FlightIdentityUtils.FlightIdentity identity = FlightIdentityUtils.resolve(
                    null,
                    null,
                    null,
                    buildFlightSeed("buscar", dto.getId(), origenSeguro, destinoSeguro, fechaSegura)
            );
            seg.put("codigoAerolinea", identity.getCarrierCode());
            seg.put("aerolinea", identity.getAirlineName());
            seg.put("numeroVuelo", identity.getFlightNumber());
            seg.put("salida", dto.getFechaSalida());
            seg.put("llegada", dto.getFechaLlegada());
            dto.setSegmentos(List.of(seg));
            dto.setAerolinea(identity.getAirlineName());
            dto.setNumeroVuelo(identity.getFlightNumber());

            // Persistir (o reusar) Product local para poder favoritear/reservar con ID numerico.
            Product persisted = productService.upsertFlightOffer(dto);
            if (persisted == null || persisted.getId() == null) {
                throw new IllegalStateException("No se pudo obtener productId para externalId: " + dto.getId());
            }
            dto.setProductId(persisted.getId());
            System.out.println("✅ Amadeus DTO persisted: externalId=" + dto.getId() + " productId=" + dto.getProductId());
            vuelosCache.put(dto.getId(), dto);

            vuelos.add(dto);
        }

        return vuelos;
    }

    @GetMapping("/random")
    public List<FlightOfferDTO> getVuelosRandom(@RequestParam(defaultValue = "20") int limit) {
        return buscarVuelos(null, null, null, limit);
    }

    @GetMapping("/random/paged")
    public ResponseEntity<Map<String, Object>> getVuelosRandomPaginados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<Product> productos = productService.getSimulatedProductsPage(page, size);
        List<FlightOfferDTO> content = productos.getContent().stream()
                .map(this::toDtoResumen)
                .toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("content", content);
        payload.put("page", productos.getNumber());
        payload.put("size", productos.getSize());
        payload.put("totalElements", productos.getTotalElements());
        payload.put("totalPages", productos.getTotalPages());
        payload.put("last", productos.isLast());
        return ResponseEntity.ok(payload);
    }





    @GetMapping("/vuelos/{id}")
    public FlightOfferDTO getVueloById(@PathVariable String id) {
        FlightOfferDTO cached = vuelosCache.get(id);
        if (cached != null) {
            return cached;
        }

        Long numericId;
        try {
            numericId = Long.parseLong(id);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vuelo no encontrado");
        }

        Product product = productService.findById(numericId);

        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vuelo no encontrado");
        }

        FlightOfferDTO dto = new FlightOfferDTO();
        dto.setId(String.valueOf(product.getId()));
        dto.setProductId(product.getId());

        // Origen y destino
        if (product.getName() != null && (product.getName().contains("→") || product.getName().contains("â†’"))) {
            String[] partes = product.getName().split("→|â†’");
            dto.setOrigen(normalizeLocationLabel(partes[0]));
            dto.setDestino(normalizeLocationLabel(partes[1]));
        } else {
            dto.setOrigen(normalizeLocationLabel(product.getName()));
            dto.setDestino(normalizeLocationLabel(product.getName()));
        }

        dto.setPaisDestino(product.getCountry() != null ? product.getCountry() : "Desconocido");
        dto.setCountry(product.getCountry() != null ? product.getCountry() : "Desconocido");

        dto.setPrecioTotal(product.getPrice());
        dto.setCategoria("Internacional"); // o product.getCategory().getName() si lo tenés

        // Segmentos
        List<Map<String, Object>> segmentos = normalizeSegments(
                productService.parseSegmentosPublic(product.getSegmentosJson()),
                buildFlightSeed("product-detail", product.getExternalId(), product.getId())
        );
        dto.setSegmentos(segmentos);

        // Normalizar fechas y aerolínea/numeroVuelo
        if (!segmentos.isEmpty()) {
            Map<String, Object> primerSegmento = segmentos.get(0);
            Map<String, Object> ultimoSegmento = segmentos.get(segmentos.size() - 1);

            FlightIdentityUtils.FlightIdentity identity = FlightIdentityUtils.resolve(
                    primerSegmento.get("codigoAerolinea"),
                    primerSegmento.get("aerolinea"),
                    primerSegmento.get("numeroVuelo"),
                    buildFlightSeed("product-detail", product.getExternalId(), product.getId())
            );
            dto.setAerolinea(identity.getAirlineName());
            dto.setNumeroVuelo(identity.getFlightNumber());

            dto.setFechaSalida(primerSegmento.get("salida") != null ? primerSegmento.get("salida").toString() : null);
            dto.setFechaLlegada(ultimoSegmento.get("llegada") != null ? ultimoSegmento.get("llegada").toString() : null);
        } else {
            // fallback si no hay segmentos
            FlightIdentityUtils.FlightIdentity identity = FlightIdentityUtils.resolve(
                    null,
                    product.getAerolinea(),
                    product.getNumeroVuelo(),
                    buildFlightSeed("product-detail-fallback", product.getExternalId(), product.getId())
            );
            dto.setAerolinea(identity.getAirlineName());
            dto.setNumeroVuelo(identity.getFlightNumber());

            dto.setFechaSalida(product.getDepartureDate() != null ? product.getDepartureDate().toString() : null);
            dto.setFechaLlegada(product.getDepartureDate() != null ? product.getDepartureDate().plusHours(2).toString() : null);
        }

        // Características deterministas para una vista de detalle consistente
        String duracion;
        if (!segmentos.isEmpty()) {
            Map<String, Object> primero = segmentos.get(0);
            Map<String, Object> ultimo = segmentos.get(segmentos.size() - 1);
            try {
                LocalDateTime salida = LocalDateTime.parse(String.valueOf(primero.get("salida")));
                LocalDateTime llegada = LocalDateTime.parse(String.valueOf(ultimo.get("llegada")));
                long minutos = Math.max(0, Duration.between(salida, llegada).toMinutes());
                duracion = (minutos / 60) + "h " + (minutos % 60) + "m";
            } catch (Exception ignored) {
                duracion = "N/D";
            }
        } else if (product.getDepartureDate() != null) {
            duracion = "2h 0m";
        } else {
            duracion = "N/D";
        }

        String clase = (product.getCategory() != null && product.getCategory().getName() != null)
                ? product.getCategory().getName()
                : "Economy";

        dto.setCaracteristicas(List.of(
                "Duracion: " + duracion,
                "Clase: " + clase,
                "Equipaje: No especificado"
        ));

        // Imágenes según país
        String codigoPais = product.getCountry() != null
                ? PAIS_POR_IATA.entrySet().stream()
                .filter(e -> e.getValue().equalsIgnoreCase(product.getCountry()))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("ARG")
                : "ARG";

        List<String> imagenesPais = IMAGENES_POR_PAIS.getOrDefault(codigoPais, List.of("default_1.jpg", "default_2.jpg"))
                .stream()
                .map(img -> "/assets/imagenespaises/" + img)
                .collect(Collectors.toList());

        dto.setImagenesPais(imagenesPais);
        dto.setImagenPrincipal(!imagenesPais.isEmpty() ? imagenesPais.get(0) : "/assets/imagenespaises/default_1.jpg");

        return dto;
    }

    private FlightOfferDTO toDtoResumen(Product product) {
        FlightOfferDTO dto = new FlightOfferDTO();
        dto.setId(String.valueOf(product.getId()));
        dto.setProductId(product.getId());

        if (product.getName() != null && (product.getName().contains("→") || product.getName().contains("â†’"))) {
            String[] partes = product.getName().split("→|â†’");
            dto.setOrigen(normalizeLocationLabel(partes[0]));
            dto.setDestino(partes.length > 1 ? normalizeLocationLabel(partes[1]) : "Desconocido");
        } else {
            dto.setOrigen(product.getName() != null ? normalizeLocationLabel(product.getName()) : "Desconocido");
            dto.setDestino(product.getCountry() != null ? product.getCountry() : "Desconocido");
        }

        dto.setPaisDestino(product.getCountry() != null ? product.getCountry() : "Desconocido");
        dto.setCountry(product.getCountry() != null ? product.getCountry() : "Desconocido");
        dto.setPrecioTotal(product.getPrice());
        dto.setFechaSalida(product.getDepartureDate() != null ? product.getDepartureDate().toString() : null);
        dto.setFechaLlegada(product.getDepartureDate() != null ? product.getDepartureDate().plusHours(2).toString() : null);

        List<Map<String, Object>> segmentos = normalizeSegments(
                productService.parseSegmentosPublic(product.getSegmentosJson()),
                buildFlightSeed("product-summary", product.getExternalId(), product.getId())
        );
        dto.setSegmentos(segmentos);
        if (!segmentos.isEmpty()) {
            Map<String, Object> primero = segmentos.get(0);
            Map<String, Object> ultimo = segmentos.get(segmentos.size() - 1);
            FlightIdentityUtils.FlightIdentity identity = FlightIdentityUtils.resolve(
                    primero.get("codigoAerolinea"),
                    primero.get("aerolinea"),
                    primero.get("numeroVuelo"),
                    buildFlightSeed("product-summary", product.getExternalId(), product.getId())
            );
            dto.setAerolinea(identity.getAirlineName());
            dto.setNumeroVuelo(identity.getFlightNumber());
            dto.setFechaSalida(String.valueOf(primero.getOrDefault("salida", dto.getFechaSalida())));
            dto.setFechaLlegada(String.valueOf(ultimo.getOrDefault("llegada", dto.getFechaLlegada())));
        } else {
            FlightIdentityUtils.FlightIdentity identity = FlightIdentityUtils.resolve(
                    null,
                    product.getAerolinea(),
                    product.getNumeroVuelo(),
                    buildFlightSeed("product-summary-fallback", product.getExternalId(), product.getId())
            );
            dto.setAerolinea(identity.getAirlineName());
            dto.setNumeroVuelo(identity.getFlightNumber());
        }

        String codigoPais = "ARG";
        if (product.getCountry() != null) {
            codigoPais = PAIS_POR_IATA.entrySet().stream()
                    .filter(e -> e.getValue().equalsIgnoreCase(product.getCountry()) || e.getKey().equalsIgnoreCase(product.getCountry()))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse("ARG");
        }

        List<String> imagenesPais = IMAGENES_POR_PAIS.getOrDefault(codigoPais, List.of("argentina_1.jpg"))
                .stream()
                .map(img -> "/assets/imagenespaises/" + img)
                .toList();
        dto.setImagenesPais(imagenesPais);
        dto.setImagenPrincipal(imagenesPais.get(0));
        dto.setCategoria("Internacional");

        return dto;
    }









}

