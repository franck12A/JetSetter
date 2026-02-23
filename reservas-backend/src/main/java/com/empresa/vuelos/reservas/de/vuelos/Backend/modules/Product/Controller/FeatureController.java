package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.FeatureService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto.FeatureDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/features")
@CrossOrigin
public class FeatureController {

    private final FeatureService service;

    public FeatureController(FeatureService service) {
        this.service = service;
    }

    @GetMapping
    public List<Feature> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Feature create(@Valid @RequestBody FeatureDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public Feature update(@PathVariable Long id, @Valid @RequestBody FeatureDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
