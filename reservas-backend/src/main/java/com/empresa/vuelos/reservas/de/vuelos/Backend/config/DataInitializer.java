package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.Role;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Service.CategoryService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        createAdminIfMissing("admin@miapp.test", "SuperSeguro123", "Admin", "Principal");
        createAdminIfMissing("admin@vuelos.com", "Admin1234", "Administrador", "Global");
        Category fallbackCategory = ensureFallbackCategory();
        assignFallbackCategoryToLegacyProducts(fallbackCategory);
    }

    private void createAdminIfMissing(String email, String password, String firstName, String lastName) {
        userRepository.findByEmail(email).orElseGet(() -> {
            User admin = new User();
            admin.setFirstName(firstName);
            admin.setLastName(lastName);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(Role.ROLE_ADMIN);
            userRepository.save(admin);
            return admin;
        });
    }

    private Category ensureFallbackCategory() {
        return categoryRepository.findByNameIgnoreCase(CategoryService.FALLBACK_CATEGORY_NAME)
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(CategoryService.FALLBACK_CATEGORY_NAME);
                    category.setDescription("Categoria de respaldo para vuelos que requieren revision.");
                    category.setIcon("MdFlightTakeoff");
                    category.setImageUrl("");
                    return categoryRepository.save(category);
                });
    }

    private void assignFallbackCategoryToLegacyProducts(Category fallbackCategory) {
        for (Product product : productRepository.findAll()) {
            if (product.getCategory() != null) {
                continue;
            }
            product.setCategory(fallbackCategory);
            productRepository.save(product);
        }
    }
}
