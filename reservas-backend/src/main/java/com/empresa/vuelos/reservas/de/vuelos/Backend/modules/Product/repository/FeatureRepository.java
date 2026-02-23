package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, Long> { }
