package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}