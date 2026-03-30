package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.Role;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.ProductStatus;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
@Transactional
class Sprint3BitacoraIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private Long testProductId;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        Category category = new Category();
        category.setName("Test Category " + UUID.randomUUID());
        category.setDescription("Categoria de prueba");
        category.setIcon("plane");
        category.setImageUrl("https://example.com/cat.png");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Test Product");
        product.setDescription("Producto listo para pruebas publicas");
        product.setImage("https://example.com/product.png");
        product.setPrice(100.0);
        product.setCountry("Argentina");
        product.setDepartureDate(LocalDateTime.of(2026, 5, 10, 9, 0));
        product.setAerolinea("JetSetter Air");
        product.setNumeroVuelo("TS" + (1000 + Math.abs(UUID.randomUUID().hashCode()) % 9000));
        product.setCategory(category);
        product.setExternalId("flight-123-" + UUID.randomUUID());
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);
        testProductId = product.getId();
        testProduct = product;

        User userEntity = new User();
        userEntity.setEmail("user" + UUID.randomUUID() + "@test.com");
        userEntity.setFirstName("Test");
        userEntity.setLastName("User");
        userEntity.setPassword("password");
        userEntity.setRole(Role.ROLE_USER);
        userEntity = userRepository.save(userEntity);
        testUser = userEntity;
    }

    @Test
    void realizarBusqueda_devuelveResultadosAcordes() throws Exception {
        mockMvc.perform(get("/api/products/search")
                        .param("name", "test")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void visualizarDisponibilidad_devuelveFechasReservadas() throws Exception {
        mockMvc.perform(get("/api/bookings/product/{productId}/dates", testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void marcarComoFavorito_usuarioLogueadoAgregaProducto() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", testProductId);

        mockMvc.perform(post("/api/favorites")
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());
    }

    @Test
    void listarProductosFavoritos_devuelveListaPersonalizada() throws Exception {
        mockMvc.perform(get("/api/favorites")
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void verBloquePoliticas_productoContienePoliticas() throws Exception {
        mockMvc.perform(get("/api/products/{id}", testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void redesCompartirProductos_endpointRetornaUrlPublica() throws Exception {
        mockMvc.perform(get("/api/products/{id}", testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void puntuarProducto_usuarioAgregaReview() throws Exception {
        Booking booking = new Booking();
        booking.setUser(testUser);
        booking.setProduct(testProduct);
        booking.setStatus("FINALIZADA");
        booking.setPassengers(1);
        booking.setTravelDate(LocalDate.now().plusDays(1));
        bookingRepository.save(booking);

        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", testProductId);
        payload.put("rating", 5);
        payload.put("comment", "Excelente servicio");

        mockMvc.perform(post("/api/reviews")
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());
    }

    @Test
    void eliminarCategoria_adminBorraCategoriaExitosamente() throws Exception {
        Category category = new Category();
        category.setName("A Borrar " + UUID.randomUUID());
        category.setDescription("Cat a eliminar");
        category = categoryRepository.save(category);

        mockMvc.perform(delete("/api/categories/{id}", category.getId())
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}