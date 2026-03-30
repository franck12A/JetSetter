package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Feature;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.FeatureRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
class Sprint2BitacoraIntegrationTests {

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

    @Autowired
    private FeatureRepository featureRepository;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        productRepository.deleteAll();
        featureRepository.deleteAll();
        categoryRepository.deleteAll();
        reset(emailService);
    }

    @Test
    void categorizarProductos_asignaCategoriaAlCrear() throws Exception {
        Category category = createCategory("Internacional " + UUID.randomUUID());
        String payload = buildProductPayload("EZE-MAD " + UUID.randomUUID(), category.getId());

        mockMvc.perform(post("/api/products")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.id").value(category.getId()))
                .andExpect(jsonPath("$.category.name").value(category.getName()));
    }

    @Test
    void crearSeccionCategorias_listaCategorias() throws Exception {
        Category category = createCategory("Nacional " + UUID.randomUUID());

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + category.getId() + ")]").exists());
    }

    @Test
    void agregarCategoria_adminPuedeCrearCategoria() throws Exception {
        String name = "Promos " + UUID.randomUUID();

        mockMvc.perform(post("/api/categories")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildCategoryPayload(name)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value(name));
    }

    @Test
    void categoriaDelSistema_noPuedeEliminarse() throws Exception {
        Category category = createCategory("Sin categoria");

        mockMvc.perform(delete("/api/categories/{id}", category.getId())
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("La categoria 'Sin categoria' es del sistema y no se puede eliminar."));
    }

    @Test
    void categoriaConVuelosAsociados_noPuedeEliminarse() throws Exception {
        Category category = createCategory("Internacional " + UUID.randomUUID());

        mockMvc.perform(post("/api/products")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("EZE-MAD " + UUID.randomUUID(), category.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/categories/{id}", category.getId())
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede eliminar la categoria porque tiene vuelos asociados."));
    }

    @Test
    void administrarCaracteristicas_crearActualizarEliminar() throws Exception {
        Long featureId = createFeatureAndReturnId("Wifi");

        mockMvc.perform(put("/api/features/{id}", featureId)
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildFeaturePayload("Wifi Premium", "wifi")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Wifi Premium"));

        mockMvc.perform(delete("/api/features/{id}", featureId)
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        assertFalse(featureRepository.findById(featureId).isPresent());
    }

    @Test
    void eliminarCaracteristica_asociadaAProductos_tambienFunciona() throws Exception {
        Category category = createCategory("Premium " + UUID.randomUUID());
        Long featureId = createFeatureAndReturnId("Equipaje");

        mockMvc.perform(post("/api/products")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildProductPayload("EZE-ROM " + UUID.randomUUID(), category.getId(), List.of(featureId))))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/features/{id}", featureId)
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        assertFalse(featureRepository.findById(featureId).isPresent());
    }

    @Test
    void visualizarCaracteristicas_listaFeatures() throws Exception {
        Feature feature = new Feature();
        feature.setName("Asiento");
        feature.setIcon("seat");
        feature = featureRepository.save(feature);

        mockMvc.perform(get("/api/features")
                        .with(user("user").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + feature.getId() + ")]").exists());
    }

    @Test
    void registrarUsuario_devuelveUsuarioSeguro() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildRegisterPayload(email, "Ana", "Suarez")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Registro exitoso, email enviado"))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("ROLE_USER"));
    }

    @Test
    void registrarUsuario_conDatosInvalidos_fallaConBadRequest() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("firstName", "Ana");
        payload.put("lastName", "Suarez");
        payload.put("email", "ana-test.com");
        payload.put("password", "123");
        payload.put("confirmPassword", "456");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void identificarUsuario_devuelveRolUser() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildRegisterPayload(email, "Luis", "Gomez")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildLoginPayload(email, "Password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("ROLE_USER"));
    }

    @Test
    void cerrarSesion_sinToken_noPermiteAccesoAdmin() throws Exception {
        mockMvc.perform(post("/api/features")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildFeaturePayload("Wifi", "wifi")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void identificarAdministrador_devuelveRolAdmin() throws Exception {
        mockMvc.perform(post("/api/auth/login/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildLoginPayload("admin@vuelos.com", "Admin1234")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@vuelos.com"))
                .andExpect(jsonPath("$.user.role").value("ROLE_ADMIN"));
    }

    @Test
    void adminPuedeActualizarRolDeUsuario() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildRegisterPayload(email, "Mora", "Lopez")))
                .andExpect(status().isOk());

        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        mockMvc.perform(put("/api/auth/{userId}/role", userId)
                        .with(user("admin@vuelos.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ROLE_ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    void usuarioNoAdmin_noPuedeActualizarRoles() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildRegisterPayload(email, "Mora", "Lopez")))
                .andExpect(status().isOk());

        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        mockMvc.perform(put("/api/auth/{userId}/role", userId)
                        .with(user("otro-user@test.com").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ROLE_ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void notificacionRegistroGmail_enviaEmailBienvenida() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildRegisterPayload(email, "Juan", "Perez")))
                .andExpect(status().isOk());

        verify(emailService).sendWelcomeEmail(eq(email), eq("Juan Perez"), eq(email));
    }

    private Category createCategory(String name) {
        Category category = new Category();
        category.setName(name);
        category.setDescription("Categoria de prueba");
        category.setIcon("plane");
        category.setImageUrl("https://example.com/cat.png");
        return categoryRepository.save(category);
    }

    private Long createFeatureAndReturnId(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/features")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildFeaturePayload(name, "wifi")))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private String buildCategoryPayload(String name) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("description", "Categoria de prueba");
        payload.put("icon", "plane");
        payload.put("imageUrl", "https://example.com/cat.png");
        return objectMapper.writeValueAsString(payload);
    }

    private String buildProductPayload(String routeLabel, Long categoryId) throws Exception {
        return buildProductPayload(routeLabel, categoryId, List.of());
    }

    private String buildProductPayload(String routeLabel, Long categoryId, List<Long> featureIds) throws Exception {
        String[] parts = routeLabel.split("\\s*(?:->|-)\\s*", 2);
        String origin = parts.length > 0 && !parts[0].isBlank() ? parts[0].trim() : "Buenos Aires";
        String destination = parts.length > 1 && !parts[1].isBlank() ? parts[1].trim() : "Madrid";
        int flightSuffix = 1000 + Math.abs(routeLabel.hashCode()) % 9000;

        Map<String, Object> payload = new HashMap<>();
        payload.put("origin", origin);
        payload.put("destination", destination);
        payload.put("description", "Vuelo de prueba");
        payload.put("price", 1200.50);
        payload.put("image", "https://example.com/image.jpg");
        payload.put("categoryId", categoryId);
        payload.put("departureDate", "2026-01-15");
        payload.put("airline", "JetSetter Air");
        payload.put("flightNumber", "JS" + flightSuffix);
        payload.put("status", "ACTIVE");
        payload.put("features", featureIds.stream().map(id -> {
            Map<String, Object> feature = new HashMap<>();
            feature.put("id", id);
            return feature;
        }).toList());
        return objectMapper.writeValueAsString(payload);
    }

    private String buildFeaturePayload(String name, String icon) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("icon", icon);
        return objectMapper.writeValueAsString(payload);
    }

    private String buildRegisterPayload(String email, String firstName, String lastName) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("firstName", firstName);
        payload.put("lastName", lastName);
        payload.put("email", email);
        payload.put("password", "Password123");
        payload.put("confirmPassword", "Password123");
        return objectMapper.writeValueAsString(payload);
    }

    private String buildLoginPayload(String email, String password) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", password);
        return objectMapper.writeValueAsString(payload);
    }
}
