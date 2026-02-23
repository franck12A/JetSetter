package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.FeatureRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeatureService {

    private final FeatureRepository repo;

    public FeatureService(FeatureRepository repo) {
        this.repo = repo;
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
                new RuntimeException("Feature no encontrada con id " + id)
        );
        f.setName(dto.getName());
        f.setIcon(dto.getIcon());
        return repo.save(f);
    }


    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ---------------------------
    // Métodos nuevos para ProductController
    // ---------------------------

    public Feature getById(Long id) {
        return repo.findById(id).orElseThrow(() ->
                new RuntimeException("Feature no encontrada con id " + id)
        );
    }

    public Feature save(Feature feature) {
        return repo.save(feature);
    }
}
