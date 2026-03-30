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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
class ProductFlowIntegrationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private BookingRepository bookingRepository;

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

    private String buildProductPayload(String origin, String destination) throws Exception {
        return buildProductPayload(origin, destination, "Vuelo de prueba", 1200.50, categoryId, "2026-01-15", "Aerolineas", "AR1234", "ACTIVE");
    }

    private String buildProductPayload(String origin, String destination, String description, double price, Long categoryIdValue,
                                       String departureDate, String airline, String flightNumber, String status) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("origin", origin);
        payload.put("destination", destination);
        payload.put("description", description);
        payload.put("price", price);
        payload.put("image", "https://example.com/image.jpg");
        payload.put("categoryId", categoryIdValue);
        payload.put("departureDate", departureDate);
        payload.put("airline", airline);
        payload.put("flightNumber", flightNumber);
        payload.put("status", status);
        return objectMapper.writeValueAsString(payload);
    }

    private Long createProductAndReturnId(String origin, String destination, String status) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(origin, destination, "Vuelo de prueba", 1200.50, categoryId, "2026-01-15", "Aerolineas", "AR" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(), status)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_returnsCreatedProduct() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Vuelo Buenos Aires -> Madrid"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createProduct_requiresAdmin() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_missingOrigin_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("", "Madrid")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.origin").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_invalidFlightNumber_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid", "Vuelo", 900.0, categoryId, "2026-01-15", "Aerolineas", "***", "ACTIVE")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_invalidAirline_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid", "Vuelo", 900.0, categoryId, "2026-01-15", "***", "AR9999", "ACTIVE")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_invalidDate_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid", "Vuelo", 900.0, categoryId, "2026-99-99", "Aerolineas", "AR9999", "ACTIVE")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_invalidPrice_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid", "Vuelo", 0.0, categoryId, "2026-01-15", "Aerolineas", "AR9999", "ACTIVE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_missingCategory_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Buenos Aires", "Madrid", "Sin categoria", 900.0, null, "2026-01-15", "Aerolineas", "AR9999", "ACTIVE")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listProducts_returnsCreatedItem() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Madrid", "ACTIVE");
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")]").exists());
    }

    @Test
    void listProducts_hidesDraftForPublic() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Roma", "DRAFT");
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")]").doesNotExist());
    }

    @Test
    void getProductById_hidesDraftForPublic() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Paris", "DRAFT");
        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProduct_updatesFields() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Madrid", "ACTIVE");
        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("Cordoba", "Barcelona", "Descripcion actualizada", 1550.75, categoryId, "2026-02-02", "Iberia", "IB4567", "ACTIVE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Descripcion actualizada"))
                .andExpect(jsonPath("$.price").value(1550.75))
                .andExpect(jsonPath("$.name").value("Vuelo Cordoba -> Barcelona"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProductStatus_activatesDraftFlight() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Lisboa", "DRAFT");
        mockMvc.perform(patch("/api/products/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk());
    }

    @Test
    void randomProducts_returnsRequestedCount() throws Exception {
        createProductAndReturnId("Buenos Aires", "Madrid", "ACTIVE");
        createProductAndReturnId("Buenos Aires", "Roma", "ACTIVE");
        createProductAndReturnId("Buenos Aires", "Nueva York", "ACTIVE");

        mockMvc.perform(get("/api/products/random").param("count", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteProduct_removesProduct() throws Exception {
        Long id = createProductAndReturnId("Buenos Aires", "Madrid", "ACTIVE");
        mockMvc.perform(delete("/api/products/{id}", id)).andExpect(status().isOk());
        mockMvc.perform(get("/api/products/{id}", id)).andExpect(status().isNotFound());
    }
}
