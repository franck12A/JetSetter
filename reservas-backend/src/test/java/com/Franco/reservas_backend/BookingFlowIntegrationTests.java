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
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
class BookingFlowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Long categoryId;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        Category category = new Category();
        category.setName("Booking Category " + UUID.randomUUID());
        category.setDescription("Categoria para reservas");
        category.setIcon("plane");
        category.setImageUrl("https://example.com/cat.png");
        categoryId = categoryRepository.save(category).getId();
    }

    @Test
    void getBookedDates_publicEndpoint_returnsReservedDate() throws Exception {
        Long productId = createProductAndReturnId("EZE -> MAD " + UUID.randomUUID());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-05-10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.travelDate").value("2026-05-10"));

        mockMvc.perform(get("/api/bookings/product/{productId}/dates", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("2026-05-10"));
    }

    @Test
    void createBooking_duplicateTravelDate_returnsConflict() throws Exception {
        Long productId = createProductAndReturnId("EZE -> ROM " + UUID.randomUUID());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-06-18")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-06-18")))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("ya tiene una reserva")));
    }

    private Long createProductAndReturnId(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(name)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private String buildProductPayload(String name) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("description", "Vuelo de prueba");
        payload.put("price", 980.0);
        payload.put("image", "https://example.com/image.jpg");
        payload.put("categoryId", categoryId);
        payload.put("country", "Argentina");
        payload.put("departureDate", "2026-05-10T09:00");
        return objectMapper.writeValueAsString(payload);
    }

    private String buildBookingPayload(Long productId, String dateStr) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", 1L);
        payload.put("productId", productId);
        payload.put("dateStr", dateStr);
        payload.put("passengers", 1);
        return objectMapper.writeValueAsString(payload);
    }
}
