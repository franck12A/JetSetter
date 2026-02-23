package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // ⚡ ESTE ES EL MÉTODO QUE FALTABA
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada con ID: " + id));
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }
    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }
}