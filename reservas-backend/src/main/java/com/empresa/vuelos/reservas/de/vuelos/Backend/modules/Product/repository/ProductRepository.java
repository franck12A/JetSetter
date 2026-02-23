package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByName(String name);
    Optional<Product> findByExternalId(String externalId);

    // JpaRepository ya te da métodos como save(), findAll(), findById(), deleteById()
}
