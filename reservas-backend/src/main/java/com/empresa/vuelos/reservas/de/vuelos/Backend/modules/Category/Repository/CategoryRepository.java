package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);
}
