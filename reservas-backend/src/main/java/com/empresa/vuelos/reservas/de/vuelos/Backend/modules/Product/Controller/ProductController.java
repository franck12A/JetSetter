package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Service.CategoryService;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.FeatureService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.ProductDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final FeatureService featureService;
    private final CategoryService categoryService;
    private final AmadeusService amadeusService;



    // Carpeta para guardar las imágenes
    private final String UPLOAD_DIR = "C:/Users/Franc/Desktop/reservas-de-vuelosimg/images/";

    public ProductController(ProductService productService, FeatureService featureService, CategoryService categoryService, AmadeusService amadeusService) {
        this.productService = productService;
        this.featureService = featureService;
        this.categoryService = categoryService;
        this.amadeusService = amadeusService;
    }

    // --- Crear producto ---
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createProduct(@RequestBody ProductDTO productDTO) {

        System.out.println("➡️ Intentando crear product");

        if (productService.existsByName(productDTO.getName())) {
            return ResponseEntity.badRequest().body("❌ Error: El nombre del vuelo ya está en uso.");
        }

        Product product = new Product();
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        // Categoría
        if (productDTO.getCategoryId() != null) {
            var category = categoryService.getById(productDTO.getCategoryId());
            product.setCategory(category);
        } else {
            return ResponseEntity.badRequest().body("❌ categoryId es obligatorio");
        }

        product.setCountry(productDTO.getCountry());

        if (productDTO.getDepartureDate() != null && !productDTO.getDepartureDate().isEmpty()) {
            String fecha = productDTO.getDepartureDate();

            LocalDateTime salida;

            if (fecha.length() == 10) {
                // Formato yyyy-MM-dd
                salida = LocalDate.parse(fecha).atStartOfDay();
            } else {
                // Formato yyyy-MM-ddTHH:mm
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
                salida = LocalDateTime.parse(fecha, formatter);
            }

            product.setDepartureDate(salida);

        }


        // Features
        Set<Feature> features = new HashSet<>();
        if (productDTO.getFeatures() != null) {
            for (FeatureDTO f : productDTO.getFeatures()) {
                if (f.getId() != null) {
                    features.add(featureService.getById(f.getId()));
                } else {
                    Feature newF = new Feature();
                    newF.setName(f.getName());
                    newF.setIcon(f.getIcon());
                    features.add(featureService.save(newF));
                }
            }
        }
        product.setFeatures(features);

        // Imágenes Base64
        if (productDTO.getImagesBase64() != null) {
            product.setImagesBase64(productDTO.getImagesBase64());
        }

        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.ok(savedProduct);
    }





    // --- Listar todos los productos ---
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

// --- Actualizar producto ---
@PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<Product> updateProduct(
        @PathVariable Long id,
        @RequestBody ProductDTO productDTO
) {

    Product updatedProduct = new Product();
    updatedProduct.setName(productDTO.getName());
    updatedProduct.setDescription(productDTO.getDescription());
    updatedProduct.setPrice(productDTO.getPrice());
    if (productDTO.getCategoryId() != null) {
        var category = categoryService.getById(productDTO.getCategoryId());
        updatedProduct.setCategory(category);
    }
    updatedProduct.setCountry(productDTO.getCountry());

    if (productDTO.getDepartureDate() != null && !productDTO.getDepartureDate().isEmpty()) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
        updatedProduct.setDepartureDate(LocalDateTime.parse(productDTO.getDepartureDate(), formatter));
    }


    // Features
    Set<Feature> features = new HashSet<>();
    if (productDTO.getFeatures() != null) {
        for (FeatureDTO f : productDTO.getFeatures()) {
            if (f.getId() != null) {
                features.add(featureService.getById(f.getId()));
            } else {
                Feature newF = new Feature();
                newF.setName(f.getName());
                newF.setIcon(f.getIcon());
                features.add(featureService.save(newF));
            }
        }
    }
    updatedProduct.setFeatures(features);

    // Imágenes Base64
    if (productDTO.getImagesBase64() != null) {
        updatedProduct.setImagesBase64(productDTO.getImagesBase64());
    }

    Product savedProduct = productService.updateProduct(id, updatedProduct);
    return ResponseEntity.ok(savedProduct);
}


    // --- Eliminar producto ---
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("Producto eliminado correctamente");
    }

    // --- Productos aleatorios ---
    @GetMapping("/random")
    public ResponseEntity<List<Product>> getRandomProducts(@RequestParam(defaultValue = "3") int count) {
        return ResponseEntity.ok(productService.getRandomProducts(count));
    }

    // --- Buscar productos por nombre o fecha ---
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String departureDate // yyyy-MM-dd
    ) {
        LocalDate fecha = null;
        if (departureDate != null && !departureDate.isEmpty()) {
            fecha = LocalDate.parse(departureDate);
        }
        List<Product> filteredProducts = productService.getProductsFilteredByDate(name, fecha);
        return ResponseEntity.ok(filteredProducts);
    }



    // --- Obtener producto por ID ---
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // --- Servir imágenes estáticas ---
    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) throws IOException {
        Path file = Paths.get(UPLOAD_DIR).resolve(filename);
        Resource resource = new UrlResource(file.toUri());
        if (resource.exists() || resource.isReadable()) {
            return ResponseEntity.ok(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/buscar")
    public List<Product> buscarVuelos(@RequestParam String origen,
                                      @RequestParam String destino,
                                      @RequestParam String fecha) throws Exception {

        List<FlightOfferDTO> vuelos = amadeusService.buscarVuelos(origen, destino, fecha);

        // Guardar todos siempre
        return productService.procesarYGuardarVuelos(vuelos);
    }


}
