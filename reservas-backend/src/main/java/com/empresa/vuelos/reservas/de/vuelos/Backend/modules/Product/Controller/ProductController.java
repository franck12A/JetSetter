package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services.AmadeusService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.FeatureService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.ProductService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.ProductDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.ProductStatusUpdateRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final FeatureService featureService;
    private final AmadeusService amadeusService;

    private final String uploadDir = "C:/Users/Franc/Desktop/reservas-de-vuelosimg/images/";

    public ProductController(ProductService productService,
                             FeatureService featureService,
                             AmadeusService amadeusService) {
        this.productService = productService;
        this.featureService = featureService;
        this.amadeusService = amadeusService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        Product savedProduct = productService.createProduct(productDTO, resolveFeatures(productDTO.getFeatures()));
        return ResponseEntity.ok(savedProduct);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        boolean isAdmin = isAdminRequest();
        List<Product> products = productService.getAllProducts();
        if (!isAdmin) {
            products = products.stream()
                    .filter(productService::isPubliclyVisible)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(products);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDTO productDTO) {
        Product savedProduct = productService.updateProduct(id, productDTO, resolveFeatures(productDTO.getFeatures()));
        return ResponseEntity.ok(savedProduct);
    }

    @PatchMapping(value = "/{id}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProductStatus(@PathVariable Long id,
                                                       @Valid @RequestBody ProductStatusUpdateRequest request) {
        Product savedProduct = productService.updateStatus(id, productService.resolveStatus(request.getStatus()));
        return ResponseEntity.ok(savedProduct);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("Producto eliminado correctamente");
    }

    @GetMapping("/random")
    public ResponseEntity<List<Product>> getRandomProducts(@RequestParam(defaultValue = "3") int count) {
        List<Product> products = productService.getAllProducts().stream()
                .filter(productService::isPubliclyVisible)
                .collect(Collectors.toList());

        java.util.Collections.shuffle(products);
        if (products.size() > count) {
            products = products.subList(0, count);
        }
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam(required = false) String name,
                                                        @RequestParam(required = false) String departureDate) {
        LocalDate fecha = null;
        if (departureDate != null && !departureDate.isEmpty()) {
            fecha = LocalDate.parse(departureDate);
        }

        boolean isAdmin = isAdminRequest();
        List<Product> filteredProducts = productService.getProductsFilteredByDate(name, fecha);

        if (!isAdmin) {
            filteredProducts = filteredProducts.stream()
                    .filter(productService::isPubliclyVisible)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(filteredProducts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        if (!isAdminRequest() && !productService.isPubliclyVisible(product)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) throws IOException {
        Path file = Paths.get(uploadDir).resolve(filename);
        Resource resource = new UrlResource(file.toUri());
        if (resource.exists() || resource.isReadable()) {
            return ResponseEntity.ok(resource);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/buscar")
    public List<Product> buscarVuelos(@RequestParam String origen,
                                      @RequestParam String destino,
                                      @RequestParam String fecha) throws Exception {
        List<FlightOfferDTO> vuelos = amadeusService.buscarVuelos(origen, destino, fecha);
        return productService.procesarYGuardarVuelos(vuelos);
    }

    private Set<Feature> resolveFeatures(List<FeatureDTO> featureDTOs) {
        Set<Feature> features = new HashSet<>();
        if (featureDTOs == null) {
            return features;
        }

        for (FeatureDTO featureDTO : featureDTOs) {
            if (featureDTO.getId() != null) {
                features.add(featureService.getById(featureDTO.getId()));
                continue;
            }

            Feature newFeature = new Feature();
            newFeature.setName(featureDTO.getName());
            newFeature.setIcon(featureDTO.getIcon());
            features.add(featureService.save(newFeature));
        }
        return features;
    }

    private boolean isAdminRequest() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
