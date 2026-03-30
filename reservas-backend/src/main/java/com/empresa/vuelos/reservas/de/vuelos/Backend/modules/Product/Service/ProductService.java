package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Service.CategoryService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.ProductDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.ProductStatus;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController.AEROPUERTOS;
import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService.IMAGENES_POR_PAIS;

@Service
public class ProductService {

    private static final DateTimeFormatter INPUT_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProductService(ProductRepository productRepository, CategoryService categoryService) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
    }

    public Product saveProduct(Product product) {
        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.DRAFT);
        }
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public Product createProduct(ProductDTO productDTO, Set<Feature> features) {
        Product product = new Product();
        applyProductData(product, productDTO, features, true);
        return saveProduct(product);
    }

    public List<Product> getAllProducts() {
        List<Product> products = productRepository.findAll();
        products.forEach(this::normalizeProductRouteNameInMemory);
        return products;
    }

    public Product getProductById(Long id) {
        Product product = productRepository.findById(id).orElse(null);
        normalizeProductRouteNameInMemory(product);
        return product;
    }

    public Product updateProduct(Long id, ProductDTO productDTO, Set<Feature> features) {
        Product product = getRequiredProduct(id);
        applyProductData(product, productDTO, features, false);
        return saveProduct(product);
    }

    public Product updateStatus(Long id, ProductStatus status) {
        Product product = getRequiredProduct(id);
        product.setStatus(status == null ? ProductStatus.DRAFT : status);
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        if (product != null) productRepository.delete(product);
    }

    public Product findById(Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        Product product = productOpt.orElse(null);
        normalizeProductRouteNameInMemory(product);
        return product;
    }

    public List<Product> findAll() {
        List<Product> products = productRepository.findAll();
        products.forEach(this::normalizeProductRouteNameInMemory);
        return products;
    }

    public Page<Product> getSimulatedProductsPage(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return productRepository.findByExternalIdStartingWith("SIM-", PageRequest.of(safePage, safeSize));
    }

    @Transactional
    public void cleanupSimulatedProducts(int ttlDays, int maxRows) {
        int safeTtlDays = Math.max(1, ttlDays);
        int safeMaxRows = Math.max(50, maxRows);

        LocalDateTime cutoff = LocalDateTime.now().minusDays(safeTtlDays);
        productRepository.deleteByExternalIdStartingWithAndCreatedAtBefore("SIM-", cutoff);

        List<Product> ordered = productRepository.findByExternalIdStartingWithOrderByCreatedAtDesc("SIM-");
        if (ordered.size() <= safeMaxRows) return;

        List<Long> idsToDelete = ordered.stream()
                .skip(safeMaxRows)
                .map(Product::getId)
                .toList();
        if (!idsToDelete.isEmpty()) {
            productRepository.deleteByIdIn(idsToDelete);
        }
    }

    public boolean existsByName(String name) {
        return productRepository.findByName(name).isPresent();
    }

    public List<Product> getRandomProducts(int count) {
        List<Product> allProducts = productRepository.findAll();
        Collections.shuffle(allProducts);
        List<Product> randomProducts = allProducts.stream().limit(count).toList();
        randomProducts.forEach(this::normalizeProductRouteNameInMemory);
        return randomProducts;
    }

    public List<Product> getProductsFilteredByCategory(String name, String category) {
        return productRepository.findAll().stream()
                .filter(p -> name == null || name.isEmpty() || p.getName().toLowerCase().contains(name.toLowerCase()))
                .filter(p -> category == null || category.isEmpty() ||
                        (p.getCategory() != null && p.getCategory().getName().equalsIgnoreCase(category)))
                .collect(Collectors.toList());
    }

    public List<Product> getProductsFilteredByDate(String name, LocalDate departureDate) {
        return productRepository.findAll().stream()
                .filter(p -> name == null || name.isEmpty() || p.getName().toLowerCase().contains(name.toLowerCase()))
                .filter(p -> departureDate == null ||
                        (p.getDepartureDate() != null && p.getDepartureDate().toLocalDate().equals(departureDate)))
                .collect(Collectors.toList());
    }

    public Product createFromAmadeusDTO(FlightOfferDTO dto) {
        Product p = new Product();
        p.setExternalId(dto.getId());
        p.setName(buildRouteLabel(dto.getOrigen(), dto.getDestino()));
        p.setDescription(buildDefaultDescription(dto.getOrigen(), dto.getDestino(), dto.getAerolinea(), dto.getNumeroVuelo(), null));
        p.setPrice(dto.getPrecioTotal());
        p.setCountry(trimToNull(dto.getPaisDestino()) != null ? dto.getPaisDestino().trim() : trimToNull(dto.getDestino()));
        p.setCategory(categoryService.getOrCreateFallbackCategory());
        p.setStatus(ProductStatus.ACTIVE);
        p.setAerolinea(trimToNull(dto.getAerolinea()));
        p.setNumeroVuelo(trimToNull(dto.getNumeroVuelo()));
        if (dto.getFechaSalida() != null) {
            p.setDepartureDate(parseDepartureDate(dto.getFechaSalida()));
        }
        return productRepository.save(p);
    }

    public Product fromFlightOfferDTO(FlightOfferDTO dto) {
        Product product = new Product();
        product.setExternalId(dto.getId());
        product.setName(buildRouteLabel(dto.getOrigen(), dto.getDestino()));
        product.setDescription(buildDefaultDescription(dto.getOrigen(), dto.getDestino(), dto.getAerolinea(), dto.getNumeroVuelo(), dto.getFechaSalida()));
        product.setPrice(dto.getPrecioTotal());
        product.setCountry(trimToNull(dto.getPaisDestino()) != null ? dto.getPaisDestino().trim() : trimToNull(dto.getDestino()));
        product.setAerolinea(trimToNull(dto.getAerolinea()));
        product.setNumeroVuelo(normalizeImportedFlightNumber(dto.getNumeroVuelo()));
        product.setImage(dto.getImagenPrincipal());
        product.setCategory(categoryService.getOrCreateFallbackCategory());
        product.setStatus(ProductStatus.ACTIVE);

        if (dto.getFechaSalida() != null) {
            product.setDepartureDate(parseDepartureDate(dto.getFechaSalida()));
        }

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

    public FlightOfferDTO mapFromProduct(Product product) {
        FlightOfferDTO dto = new FlightOfferDTO();
        dto.setId(String.valueOf(product.getId()));
        dto.setProductId(product.getId());

        String[] partesNombre = splitRouteLabel(product.getName());
        dto.setOrigen(partesNombre.length > 0 ? partesNombre[0] : product.getName());
        dto.setDestino(partesNombre.length > 1 ? partesNombre[1] : "Desconocido");
        dto.setFechaSalida(product.getDepartureDate() != null ? product.getDepartureDate().toString() : null);
        dto.setFechaLlegada(product.getDepartureDate() != null ? product.getDepartureDate().plusHours(2).toString() : null);
        dto.setAerolinea(product.getAerolinea() != null ? product.getAerolinea() : "Desconocida");
        dto.setNumeroVuelo(product.getNumeroVuelo() != null ? product.getNumeroVuelo() : "000");
        dto.setPrecioTotal(product.getPrice());

        String destinoIata = extractDestinoIata(product);
        String codigoPais = AmadeusController.AEROPUERTOS.getOrDefault(destinoIata, Map.of("pais", "DES")).get("pais").toString();
        String nombrePais = AmadeusController.PAIS_POR_IATA.getOrDefault(codigoPais, "Desconocido");
        dto.setPaisDestino(nombrePais);
        dto.setCountry(nombrePais);

        List<String> imgs = IMAGENES_POR_PAIS.getOrDefault(codigoPais, List.of("default_1.jpg", "default_2.jpg"));
        dto.setImagenPrincipal("/assets/imagenespaises/" + imgs.get(0));
        dto.setImagenesPais(imgs.stream().map(i -> "/assets/imagenespaises/" + i).toList());
        dto.setSegmentos(parseSegmentos(product.getSegmentosJson()));
        dto.setCaracteristicas(List.of(
                "Duracion aproximada: 2h",
                "Clase: Lite",
                "Equipaje incluido: No"
        ));
        dto.setCategoria(product.getCategory() != null ? product.getCategory().getName() : CategoryService.FALLBACK_CATEGORY_NAME);

        try {
            ObjectMapper mapper = new ObjectMapper();
            if (product.getImagenesUrlsJson() != null) {
                List<String> urls = mapper.readValue(product.getImagenesUrlsJson(), new TypeReference<List<String>>() {});
                dto.setImagenesUrls(urls);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dto;
    }

    public List<Map<String, Object>> parseSegmentosPublic(String segmentosJson) {
        if (segmentosJson == null || segmentosJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(segmentosJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<String> parseImagenes(String imagenesJson) {
        if (imagenesJson == null || imagenesJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(imagenesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Product saveIfNotExists(FlightOfferDTO dto) {
        Optional<Product> existing = productRepository.findByExternalId(dto.getId());

        if (existing.isPresent()) {
            Product product = existing.get();
            String normalizedName = normalizeRouteLabel(buildRouteLabel(dto.getOrigen(), dto.getDestino()));
            if (normalizedName != null && !normalizedName.equals(product.getName())) {
                product.setName(normalizedName);
                if (product.getCategory() == null) {
                    product.setCategory(categoryService.getOrCreateFallbackCategory());
                }
                if (product.getStatus() == null) {
                    product.setStatus(ProductStatus.ACTIVE);
                }
                product.setUpdatedAt(LocalDateTime.now());
                return productRepository.save(product);
            }
            return product;
        }

        Product nuevo = fromFlightOfferDTO(dto);
        return productRepository.save(nuevo);
    }

    public List<Product> procesarYGuardarVuelos(List<FlightOfferDTO> vuelosDTO) {
        List<Product> productos = new ArrayList<>();

        for (FlightOfferDTO dto : vuelosDTO) {
            Optional<Product> existente = productRepository.findByExternalId(dto.getId());
            Product p;
            if (existente.isPresent()) {
                p = existente.get();
                String normalizedName = normalizeRouteLabel(buildRouteLabel(dto.getOrigen(), dto.getDestino()));
                if (normalizedName != null && !normalizedName.equals(p.getName())) {
                    p.setName(normalizedName);
                }
                if (p.getCategory() == null) {
                    p.setCategory(categoryService.getOrCreateFallbackCategory());
                }
                if (p.getStatus() == null) {
                    p.setStatus(ProductStatus.ACTIVE);
                }
                p.setUpdatedAt(LocalDateTime.now());
                p = productRepository.save(p);
            } else {
                p = fromFlightOfferDTO(dto);
                productRepository.save(p);
            }

            productos.add(p);
        }

        return productos;
    }

    public boolean isPubliclyVisible(Product product) {
        return product != null && product.getStatus() != null && product.getStatus().isPubliclyVisible();
    }

    public ProductStatus resolveStatus(String rawStatus) {
        return ProductStatus.from(rawStatus);
    }

    private Product getRequiredProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El vuelo no existe."));
    }

    private void applyProductData(Product product, ProductDTO dto, Set<Feature> features, boolean creating) {
        String origin = normalizeLocation(resolveOrigin(dto), "El origen es obligatorio.", "El origen no es valido.");
        String destination = normalizeLocation(resolveDestination(dto), "El destino es obligatorio.", "El destino no es valido.");
        if (origin.equalsIgnoreCase(destination)) {
            throw new IllegalArgumentException("El origen y el destino deben ser diferentes.");
        }

        LocalDateTime departureDate = parseDepartureDate(dto.getDepartureDate());
        String airline = normalizeAirline(dto.getAirline());
        String flightNumber = normalizeFlightNumber(dto.getFlightNumber());
        ensureUniqueFlight(flightNumber, departureDate, product.getId());
        Category category = categoryService.resolveRequiredCategory(dto.getCategoryId());

        product.setName(buildRouteLabel(origin, destination));
        product.setDescription(resolveDescription(dto.getDescription(), origin, destination, airline, flightNumber, departureDate));
        product.setPrice(dto.getPrice());
        product.setImage(trimToNull(dto.getImage()));
        product.setCategory(category);
        product.setCountry(trimToNull(dto.getCountry()) != null ? dto.getCountry().trim() : destination);
        product.setDepartureDate(departureDate);
        product.setAerolinea(airline);
        product.setNumeroVuelo(flightNumber);
        product.setStatus(resolveStatus(dto.getStatus(), product.getStatus(), creating));
        product.setFeatures(features != null ? new HashSet<>(features) : new HashSet<>());

        if (dto.getImagesBase64() != null) {
            product.setImagesBase64(dto.getImagesBase64());
        }

        if (creating && product.getCreatedAt() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        product.setUpdatedAt(LocalDateTime.now());
    }

    private ProductStatus resolveStatus(String rawStatus, ProductStatus currentStatus, boolean creating) {
        if (rawStatus == null || rawStatus.isBlank()) {
            if (creating) return ProductStatus.DRAFT;
            return currentStatus != null ? currentStatus : ProductStatus.DRAFT;
        }
        return ProductStatus.from(rawStatus);
    }

    private String resolveOrigin(ProductDTO dto) {
        if (trimToNull(dto.getOrigin()) != null) return dto.getOrigin().trim();
        String[] route = splitRouteLabel(dto.getName());
        return route.length > 0 ? route[0] : "";
    }

    private String resolveDestination(ProductDTO dto) {
        if (trimToNull(dto.getDestination()) != null) return dto.getDestination().trim();
        if (trimToNull(dto.getCountry()) != null) return dto.getCountry().trim();
        String[] route = splitRouteLabel(dto.getName());
        return route.length > 1 ? route[1] : "";
    }

    private String[] splitRouteLabel(String rawName) {
        if (rawName == null || rawName.isBlank()) return new String[0];
        String clean = rawName.replaceFirst("(?i)^Vuelo\\s+", "").trim();
        return clean.split("\\s*(?:->|-)\\s*");
    }

    private String normalizeLocation(String rawValue, String requiredMessage, String invalidMessage) {
        String value = trimToNull(rawValue);
        if (value == null) {
            throw new IllegalArgumentException(requiredMessage);
        }
        String sanitized = value.replaceAll("\\s+", " ").trim();
        if (!sanitized.matches("^[\\p{L}0-9][\\p{L}0-9 .,'-]{1,79}$")) {
            throw new IllegalArgumentException(invalidMessage);
        }
        return sanitized;
    }

    private String normalizeAirline(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null) {
            throw new IllegalArgumentException("La aerolinea es obligatoria.");
        }
        String sanitized = value.replaceAll("\\s+", " ").trim();
        if (!sanitized.matches("^[\\p{L}0-9][\\p{L}0-9 .&/'-]{1,59}$")) {
            throw new IllegalArgumentException("La aerolinea no es valida.");
        }
        return sanitized;
    }

    private String normalizeFlightNumber(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null) {
            throw new IllegalArgumentException("El numero de vuelo es obligatorio.");
        }
        String sanitized = value.replaceAll("\\s+", "").toUpperCase();
        if (!sanitized.matches("^[A-Z0-9]{2,3}-?[A-Z0-9]{1,6}$")) {
            throw new IllegalArgumentException("El numero de vuelo no es valido.");
        }
        return sanitized;
    }

    private String normalizeImportedFlightNumber(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null) return null;
        return value.replaceAll("\\s+", "").toUpperCase();
    }

    private LocalDateTime parseDepartureDate(String rawDate) {
        String value = trimToNull(rawDate);
        if (value == null) {
            throw new IllegalArgumentException("La fecha de salida es obligatoria.");
        }

        try {
            if (value.length() == 10) {
                return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
            }
            if (value.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}")) {
                return LocalDateTime.parse(value, INPUT_DATE_TIME);
            }
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("La fecha de salida no es valida.");
        }
    }

    private void ensureUniqueFlight(String flightNumber, LocalDateTime departureDate, Long currentId) {
        Optional<Product> existing = productRepository.findByNumeroVueloIgnoreCaseAndDepartureDate(flightNumber, departureDate);
        if (existing.isPresent() && (currentId == null || !existing.get().getId().equals(currentId))) {
            throw new IllegalArgumentException("Ya existe un vuelo con ese numero para la fecha indicada.");
        }
    }

    private String resolveDescription(String rawDescription, String origin, String destination, String airline,
                                      String flightNumber, LocalDateTime departureDate) {
        String description = trimToNull(rawDescription);
        if (description != null) {
            return description;
        }
        return buildDefaultDescription(origin, destination, airline, flightNumber, departureDate != null ? departureDate.toString() : null);
    }

    private String buildDefaultDescription(String origin, String destination, String airline, String flightNumber, String departureDate) {
        StringBuilder builder = new StringBuilder();
        builder.append("Vuelo ")
                .append(origin != null ? origin : "Origen")
                .append(" -> ")
                .append(destination != null ? destination : "Destino");

        if (trimToNull(airline) != null) {
            builder.append(" con ").append(airline.trim());
        }
        if (trimToNull(flightNumber) != null) {
            builder.append(" (").append(flightNumber.trim()).append(")");
        }
        if (trimToNull(departureDate) != null) {
            builder.append(". Salida: ").append(departureDate.trim());
        }
        return builder.toString();
    }

    private String buildRouteLabel(String origin, String destination) {
        return "Vuelo " + origin + " -> " + destination;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String extractDestinoIata(Product product) {
        String[] partes = splitRouteLabel(product.getName());
        if (partes.length > 1) {
            return partes[1].trim();
        }
        return "DES";
    }

    private List<Map<String, Object>> parseSegmentos(String segmentosJson) {
        if (segmentosJson == null || segmentosJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(segmentosJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private void normalizeProductRouteNameInMemory(Product product) {
        if (product == null) return;
        String normalized = normalizeRouteLabel(product.getName());
        if (normalized != null && !normalized.equals(product.getName())) {
            product.setName(normalized);
        }
        if (product.getCategory() == null) {
            product.setCategory(categoryService.getOrCreateFallbackCategory());
        }
        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.DRAFT);
        }
    }

    private String normalizeRouteLabel(String rawName) {
        if (rawName == null || rawName.isBlank()) return rawName;

        String clean = rawName.replaceFirst("(?i)^Vuelo\\s+", "").trim();
        String[] parts = clean.split("\\s*(?:->|-)\\s*");
        if (parts.length < 2) return rawName;

        String origin = toDisplayLocation(parts[0]);
        String destination = toDisplayLocation(parts[1]);
        return buildRouteLabel(origin, destination);
    }

    private String toDisplayLocation(String token) {
        if (token == null || token.isBlank()) return "Desconocido";

        String trimmed = token.trim();
        String upper = trimmed.toUpperCase();
        if (AEROPUERTOS.containsKey(upper)) {
            Object city = AEROPUERTOS.get(upper).get("ciudad");
            if (city != null && !String.valueOf(city).isBlank()) {
                return String.valueOf(city);
            }
            return upper;
        }

        return AEROPUERTOS.values().stream()
                .filter(v -> {
                    String city = String.valueOf(v.getOrDefault("ciudad", ""));
                    String airport = String.valueOf(v.getOrDefault("nombre", ""));
                    return city.equalsIgnoreCase(trimmed) || airport.equalsIgnoreCase(trimmed);
                })
                .map(v -> String.valueOf(v.getOrDefault("ciudad", trimmed)))
                .findFirst()
                .orElse(trimmed);
    }
}
