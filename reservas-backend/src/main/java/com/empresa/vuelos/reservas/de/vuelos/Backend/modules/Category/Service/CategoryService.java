package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    public static final String FALLBACK_CATEGORY_NAME = "Sin categoria";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return resolveRequiredCategory(id);
    }

    public Optional<Category> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        return categoryRepository.findByNameIgnoreCase(name.trim());
    }

    public Category resolveRequiredCategory(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("La categoria es obligatoria.");
        }

        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La categoria seleccionada no existe."));
    }

    public Category getOrCreateFallbackCategory() {
        return categoryRepository.findByNameIgnoreCase(FALLBACK_CATEGORY_NAME)
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(FALLBACK_CATEGORY_NAME);
                    category.setDescription("Categoria de respaldo para vuelos que requieren revision.");
                    category.setIcon("MdFlightTakeoff");
                    category.setImageUrl("");
                    return categoryRepository.save(category);
                });
    }

    public boolean isSystemCategory(Category category) {
        if (category == null) {
            return false;
        }
        return isSystemCategoryName(category.getName());
    }

    public boolean isSystemCategoryName(String name) {
        return name != null && FALLBACK_CATEGORY_NAME.equalsIgnoreCase(name.trim());
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        Category category = resolveRequiredCategory(id);

        if (isSystemCategory(category)) {
            throw new IllegalStateException("La categoria 'Sin categoria' es del sistema y no se puede eliminar.");
        }

        long productsUsingCategory = productRepository.countByCategoryId(category.getId());
        if (productsUsingCategory > 0) {
            throw new IllegalStateException("No se puede eliminar la categoria porque tiene vuelos asociados.");
        }

        categoryRepository.delete(category);
    }
}
