package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.FeatureRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeatureService {

    private final FeatureRepository repo;
    private final ProductRepository productRepository;

    public FeatureService(FeatureRepository repo, ProductRepository productRepository) {
        this.repo = repo;
        this.productRepository = productRepository;
    }

    public List<Feature> getAll() {
        return repo.findAll();
    }

    public Feature create(FeatureDTO dto) {
        Feature f = new Feature();
        f.setName(dto.getName());
        f.setIcon(dto.getIcon());
        return repo.save(f);
    }

    public Feature update(Long id, FeatureDTO dto) {
        Feature f = repo.findById(id).orElseThrow(() ->
                new IllegalArgumentException("Caracteristica no encontrada con id " + id)
        );
        f.setName(dto.getName());
        f.setIcon(dto.getIcon());
        return repo.save(f);
    }

    @Transactional
    public void delete(Long id) {
        Feature feature = repo.findById(id).orElseThrow(() ->
                new IllegalArgumentException("Caracteristica no encontrada con id " + id)
        );

        List<Product> products = productRepository.findByFeatures_Id(id);
        for (Product product : products) {
            product.getFeatures().removeIf(item -> item.getId().equals(id));
        }
        if (!products.isEmpty()) {
            productRepository.saveAll(products);
        }

        repo.delete(feature);
    }

    // ---------------------------
    // Métodos nuevos para ProductController
    // ---------------------------

    public Feature getById(Long id) {
        return repo.findById(id).orElseThrow(() ->
                new IllegalArgumentException("Caracteristica no encontrada con id " + id)
        );
    }

    public Feature save(Feature feature) {
        return repo.save(feature);
    }
}
