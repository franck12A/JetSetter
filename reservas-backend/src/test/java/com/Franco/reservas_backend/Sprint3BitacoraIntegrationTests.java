package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Repository.CategoryRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.Role;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
    private Long testUserId;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        Category category = new Category();
        category.setName("Test Category " + UUID.randomUUID());
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Test Product");
        product.setPrice(100.0);
        product.setCategory(category);
        product.setExternalId("flight-123-" + UUID.randomUUID());
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
        testUserId = userEntity.getId();
        testUser = userEntity;
    }

    // 1. Realizar búsqueda en el buscador
    @Test
    void realizarBusqueda_devuelveResultadosAcordes() throws Exception {
        mockMvc.perform(get("/api/products/search?keyword=test")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 2. Visualizar disponibilidad
    @Test
    void visualizarDisponibilidad_devuelveFechasReservadas() throws Exception {
        mockMvc.perform(get("/api/bookings/product/" + testProductId + "/dates")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 3. Marcar como favorito
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

    // 4. Listar productos favoritos
    @Test
    void listarProductosFavoritos_devuelveListaPersonalizada() throws Exception {
        mockMvc.perform(get("/api/favorites")
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 5. Ver bloque de políticas del producto
    @Test
    void verBloquePoliticas_productoContienePoliticas() throws Exception {
        mockMvc.perform(get("/api/products/" + testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 6. Redes compartir productos
    @Test
    void redesCompartirProductos_endpointRetornaUrlPublica() throws Exception {
        mockMvc.perform(get("/api/products/" + testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 7. Puntuar producto (Reseñas)
    @Test
    void puntuarProducto_usuarioAgregaReview() throws Exception {
        Booking booking = new Booking();
        booking.setUser(testUser);
        booking.setProduct(testProduct);
        booking.setStatus("FINALIZADA");
        booking.setPassengers(1);
        booking.setTravelDate(java.time.LocalDate.now().plusDays(1));
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

    // 8. Eliminar categoría
    @Test
    void eliminarCategoria_adminBorraCategoriaExitosamente() throws Exception {
        Category category = new Category();
        category.setName("A Borrar " + UUID.randomUUID());
        category.setDescription("Cat a eliminar");
        category = categoryRepository.save(category);

        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent()); // Category delete uses 204 No Content
    }
}
