package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByName(String name);
    Optional<Product> findByExternalId(String externalId);
    Optional<Product> findByNumeroVueloIgnoreCaseAndDepartureDate(String numeroVuelo, LocalDateTime departureDate);
    List<Product> findByFeatures_Id(Long featureId);
    Page<Product> findByExternalIdStartingWith(String prefix, Pageable pageable);
    List<Product> findByExternalIdStartingWithOrderByCreatedAtDesc(String prefix);
    long countByExternalIdStartingWith(String prefix);
    long countByCategoryId(Long categoryId);
    boolean existsByCategoryId(Long categoryId);
    void deleteByExternalIdStartingWithAndCreatedAtBefore(String prefix, LocalDateTime cutoff);
    void deleteByIdIn(List<Long> ids);
}
