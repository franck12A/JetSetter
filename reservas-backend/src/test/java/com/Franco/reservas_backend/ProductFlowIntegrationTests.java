package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
class ProductFlowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private Long categoryId;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        Category category = new Category();
        category.setName("Test Category");
        category.setDescription("Categoria de prueba");
        category.setIcon("plane");
        category.setImageUrl("https://example.com/cat.png");
        categoryId = categoryRepository.save(category).getId();
    }

    private String buildProductPayload(String name) throws Exception {
        return buildProductPayload(name, "Vuelo de prueba", 1200.50, categoryId, "2026-01-15");
    }

    private String buildProductPayload(String name, String description, double price, Long categoryIdValue, String departureDate) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("description", description);
        payload.put("price", price);
        payload.put("image", "https://example.com/image.jpg");
        if (categoryIdValue != null) {
            payload.put("categoryId", categoryIdValue);
        }
        payload.put("country", "Argentina");
        if (departureDate != null) {
            payload.put("departureDate", departureDate);
        }
        return objectMapper.writeValueAsString(payload);
    }

    private Long createProductAndReturnId(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_returnsCreatedProduct() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").isNotEmpty());
    }

    @Test
    void createProduct_requiresAdmin() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_missingCategory_returnsBadRequest() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name, "Sin categoria", 900.0, null, "2026-01-15")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_duplicateName_returnsBadRequest() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        createProductAndReturnId(name);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listProducts_returnsCreatedItem() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")]").exists());
    }

    @Test
    void searchProducts_byName_returnsMatch() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        mockMvc.perform(get("/api/products/search")
                        .param("name", "EZE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")]").exists());
    }

    @Test
    void randomProducts_returnsRequestedCount() throws Exception {
        createProductAndReturnId("EZE -> MAD " + UUID.randomUUID());
        createProductAndReturnId("EZE -> ROM " + UUID.randomUUID());
        createProductAndReturnId("EZE -> NYC " + UUID.randomUUID());

        mockMvc.perform(get("/api/products/random")
                        .param("count", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void getProductById_returnsProduct() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").isNotEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProduct_updatesFields() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        String newDescription = "Descripcion actualizada";
        double newPrice = 1550.75;

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("EZE -> BCN " + UUID.randomUUID(), newDescription, newPrice, categoryId, "2026-02-02T10:00")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value(newDescription))
                .andExpect(jsonPath("$.price").value(newPrice));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteProduct_removesProduct() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteProduct_requiresAdmin() throws Exception {
        String name = "EZE -> MAD " + UUID.randomUUID();
        Long id = createProductAndReturnId(name);

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isUnauthorized());
    }
}
