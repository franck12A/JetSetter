package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
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
import java.util.*;
import java.util.stream.Collectors;

import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController.AEROPUERTOS;
import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService.IMAGENES_POR_PAIS;
import static com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService.NOMBRES_PAISES;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();


    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
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

    public Product updateProduct(Long id, Product updatedProduct) {
        Product product = getProductById(id);
        if (product == null) return null;
        product.setName(updatedProduct.getName());
        product.setDescription(updatedProduct.getDescription());
        product.setPrice(updatedProduct.getPrice());

        if (updatedProduct.getImage() != null && !updatedProduct.getImage().isEmpty()) {
            product.setImage(updatedProduct.getImage());
        }

        if (updatedProduct.getDepartureDate() != null) {
            product.setDepartureDate(updatedProduct.getDepartureDate());
        }
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

    // Filtrado por nombre y categoría
    public List<Product> getProductsFilteredByCategory(String name, String category) {
        return productRepository.findAll().stream()
                .filter(p -> name == null || name.isEmpty() || p.getName().toLowerCase().contains(name.toLowerCase()))
                .filter(p -> category == null || category.isEmpty() ||
                        (p.getCategory() != null && p.getCategory().getName().equalsIgnoreCase(category)))

                .collect(Collectors.toList());
    }



    // Filtrado por nombre y fecha de salida
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
        p.setName(dto.getOrigen() + " → " + dto.getDestino());
        p.setDescription("Vuelo importado desde Amadeus");
        p.setPrice(dto.getPrecioTotal());
        p.setCountry(dto.getPaisDestino());
        if (dto.getFechaSalida() != null) {
            p.setDepartureDate(LocalDateTime.parse(dto.getFechaSalida()));
        }
        return productRepository.save(p);
    }

    public Product fromFlightOfferDTO(FlightOfferDTO dto) {
        Product product = new Product();
        product.setExternalId(dto.getId());
        product.setName("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());

        // Construimos descripción con campos reales
        String desc = "Aerolínea: " + dto.getAerolinea() +
                " | Vuelo: " + dto.getNumeroVuelo() +
                " | Salida: " + dto.getFechaSalida() +
                " | Llegada: " + dto.getFechaLlegada();
        product.setDescription(desc);

        product.setPrice(dto.getPrecioTotal());
        product.setCountry(dto.getPaisDestino());
        product.setAerolinea(dto.getAerolinea());
        product.setNumeroVuelo(dto.getNumeroVuelo());
        product.setImage(dto.getImagenPrincipal());

        if (dto.getFechaSalida() != null) {
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
        }

        // Guardar segmentos e imágenes como JSON si querés reconstruirlos después
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

        // ID y ProductId
        dto.setId(String.valueOf(product.getId()));
        dto.setProductId(product.getId());

        // Origen y destino
        String[] partesNombre = product.getName().split("→");
        dto.setOrigen(product.getName()); // si querés mostrar todo como "Vuelo A → B"
        dto.setDestino(partesNombre.length > 1 ? partesNombre[1].trim() : "Desconocido");

        // Fechas
        dto.setFechaSalida(product.getDepartureDate() != null ? product.getDepartureDate().toString() : null);
        dto.setFechaLlegada(product.getDepartureDate() != null ? product.getDepartureDate().plusHours(2).toString() : null); // ejemplo aproximado

        // Aerolínea y número de vuelo
        dto.setAerolinea(product.getAerolinea() != null ? product.getAerolinea() : "Desconocida");
        dto.setNumeroVuelo(product.getNumeroVuelo() != null ? product.getNumeroVuelo() : "000");

        // Precio
        dto.setPrecioTotal(product.getPrice());

        // País
        String destinoIata = extractDestinoIata(product);
        String codigoPais = AmadeusController.AEROPUERTOS.getOrDefault(destinoIata, Map.of("pais", "DES")).get("pais").toString();
        String nombrePais = AmadeusController.PAIS_POR_IATA.getOrDefault(codigoPais, "Desconocido");
        dto.setPaisDestino(nombrePais);
        dto.setCountry(nombrePais);

        // Imágenes
        List<String> imgs = IMAGENES_POR_PAIS.getOrDefault(codigoPais, List.of("default_1.jpg", "default_2.jpg"));
        dto.setImagenPrincipal("/assets/imagenespaises/" + imgs.get(0));
        dto.setImagenesPais(imgs.stream().map(i -> "/assets/imagenespaises/" + i).toList());

        // Segmentos
        dto.setSegmentos(parseSegmentos(product.getSegmentosJson()));

        // Características y categoría
        dto.setCaracteristicas(List.of(
                "Duración aproximada: 2h",  // podés mejorar con cálculo real si querés
                "Clase: Lite",
                "Equipaje incluido: No"
        ));
        dto.setCategoria("Internacional");

        // URLs de imágenes (si querés mantenerlas aparte)
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

    // Convierte el JSON de segmentos a List<Map<String,Object>>
    public List<Map<String, Object>> parseSegmentosPublic(String segmentosJson) {
        if (segmentosJson == null || segmentosJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(segmentosJson, new TypeReference<List<Map<String,Object>>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Convierte el JSON de imágenes a List<String>
    public List<String> parseImagenes(String imagenesJson) {
        if (imagenesJson == null || imagenesJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(imagenesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }



    // Extrae el IATA del destino desde el Product
    private String extractDestinoIata(Product product) {
        if (product.getName() != null && product.getName().contains("→")) {
            String[] partes = product.getName().split("→");
            return partes[1].trim();
        }
        return "DES";
    }

    // Convierte el JSON de segmentos a List<Map<String,Object>>
    private List<Map<String, Object>> parseSegmentos(String segmentosJson) {
        if (segmentosJson == null || segmentosJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(segmentosJson, new TypeReference<List<Map<String,Object>>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }




    public Product saveIfNotExists(FlightOfferDTO dto) {
        // ¿Existe un producto con este externalId?
        Optional<Product> existing = productRepository.findByExternalId(dto.getId());

        if (existing.isPresent()) {
            Product product = existing.get();
            String normalizedName = normalizeRouteLabel("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());
            if (normalizedName != null && !normalizedName.equals(product.getName())) {
                product.setName(normalizedName);
                product.setUpdatedAt(LocalDateTime.now());
                return productRepository.save(product);
            }
            return product; // ya existe
        }

        // Si no existe → crearlo
        Product nuevo = fromFlightOfferDTO(dto); // tu método de mapeo a Product
        return productRepository.save(nuevo);
    }

    public List<Product> procesarYGuardarVuelos(List<FlightOfferDTO> vuelosDTO) {
        List<Product> productos = new ArrayList<>();

        for (FlightOfferDTO dto : vuelosDTO) {
            // Guardar el vuelo solo si no existe en la base de datos
            Optional<Product> existente = productRepository.findByExternalId(dto.getId());
            Product p;
            if (existente.isPresent()) {
                p = existente.get();
                String normalizedName = normalizeRouteLabel("Vuelo " + dto.getOrigen() + " → " + dto.getDestino());
                if (normalizedName != null && !normalizedName.equals(p.getName())) {
                    p.setName(normalizedName);
                    p.setUpdatedAt(LocalDateTime.now());
                    p = productRepository.save(p);
                }
            } else {
                p = fromFlightOfferDTO(dto);
                productRepository.save(p);
            }

            productos.add(p);
        }

        return productos;
    }









    private void normalizeProductRouteNameInMemory(Product product) {
        if (product == null) return;
        String normalized = normalizeRouteLabel(product.getName());
        if (normalized != null && !normalized.equals(product.getName())) {
            product.setName(normalized);
        }
    }

    private String normalizeRouteLabel(String rawName) {
        if (rawName == null || rawName.isBlank()) return rawName;

        String clean = rawName.replaceFirst("(?i)^Vuelo\\s+", "").trim();
        String[] parts = clean.split("\\s*(?:→|->|-)\\s*");
        if (parts.length < 2) return rawName;

        String origen = toDisplayLocation(parts[0]);
        String destino = toDisplayLocation(parts[1]);
        return "Vuelo " + origen + " → " + destino;
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
