package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
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

    @MockBean
    private EmailService emailService;

    private Long categoryId;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        reset(emailService);

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
                .andExpect(status().isCreated())
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
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-06-18")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El rango seleccionado incluye fechas no disponibles para este vuelo."));
    }

    @Test
    void createBooking_withRoundTripRange_returnsCreatedAndSendsEmail() throws Exception {
        Long productId = createProductAndReturnId("EZE -> BCN " + UUID.randomUUID());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-07-02", "2026-07-08")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.travelDate").value("2026-07-02"))
                .andExpect(jsonPath("$.returnDate").value("2026-07-08"))
                .andExpect(jsonPath("$.status").value("CONFIRMADA"));

        mockMvc.perform(get("/api/bookings/product/{productId}/dates", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("2026-07-02"))
                .andExpect(jsonPath("$[6]").value("2026-07-08"));

        verify(emailService).sendBookingConfirmationEmail(
                eq("admin@vuelos.com"),
                eq("Administrador Global"),
                org.mockito.ArgumentMatchers.contains("Vuelo EZE -> BCN"),
                org.mockito.ArgumentMatchers.any(),
                eq(java.time.LocalDate.parse("2026-07-02")),
                eq(java.time.LocalDate.parse("2026-07-08")),
                eq("JetSetter Air"),
                org.mockito.ArgumentMatchers.startsWith("BK")
        );
    }

    @Test
    void createBooking_returnDateBeforeTravelDate_returnsBadRequest() throws Exception {
        Long productId = createProductAndReturnId("EZE -> MEX " + UUID.randomUUID());

        mockMvc.perform(post("/api/bookings/create")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBookingPayload(productId, "2026-08-15", "2026-08-10")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha de regreso no puede ser anterior a la salida."));
    }

    private Long createProductAndReturnId(String routeLabel) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload(routeLabel)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private String buildProductPayload(String routeLabel) throws Exception {
        String[] parts = routeLabel.split("\\s*(?:->|-)\\s*", 2);
        String origin = parts.length > 0 && !parts[0].isBlank() ? parts[0].trim() : "Buenos Aires";
        String destination = parts.length > 1 && !parts[1].isBlank() ? parts[1].trim() : "Madrid";
        int flightSuffix = 1000 + Math.abs(routeLabel.hashCode()) % 9000;

        Map<String, Object> payload = new HashMap<>();
        payload.put("origin", origin);
        payload.put("destination", destination);
        payload.put("description", "Vuelo de prueba");
        payload.put("price", 980.0);
        payload.put("image", "https://example.com/image.jpg");
        payload.put("categoryId", categoryId);
        payload.put("departureDate", "2026-05-10");
        payload.put("airline", "JetSetter Air");
        payload.put("flightNumber", "BK" + flightSuffix);
        payload.put("status", "ACTIVE");
        return objectMapper.writeValueAsString(payload);
    }

    private String buildBookingPayload(Long productId, String dateStr) throws Exception {
        return buildBookingPayload(productId, dateStr, null);
    }

    private String buildBookingPayload(Long productId, String dateStr, String returnDateStr) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", 1L);
        payload.put("productId", productId);
        payload.put("dateStr", dateStr);
        if (returnDateStr != null) {
            payload.put("returnDateStr", returnDateStr);
        }
        payload.put("passengers", 1);
        return objectMapper.writeValueAsString(payload);
    }
}
