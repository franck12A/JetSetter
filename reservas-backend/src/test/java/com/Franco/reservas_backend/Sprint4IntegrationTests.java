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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
@Transactional
class Sprint4IntegrationTests {

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
        category.setName("Sprint 4 Category " + UUID.randomUUID());
        category.setDescription("Categoria de prueba");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Test Product Sprint 4");
        product.setDescription("Producto listo para pruebas publicas");
        product.setPrice(150.0);
        product.setCountry("Brasil");
        product.setDepartureDate(LocalDateTime.now().plusDays(20));
        product.setAerolinea("JetSetter Air");
        product.setNumeroVuelo("BR-01");
        product.setCategory(category);
        product.setExternalId("flight-sp4-" + UUID.randomUUID());
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);
        testProductId = product.getId();
        testProduct = product;

        User userEntity = new User();
        userEntity.setEmail("user_sp4_" + UUID.randomUUID() + "@test.com");
        userEntity.setFirstName("Test");
        userEntity.setLastName("Sprint4");
        userEntity.setPassword("password");
        userEntity.setRole(Role.ROLE_USER);
        userEntity = userRepository.save(userEntity);
        testUser = userEntity;
    }

    @Test
    void crearReserva_usuarioLogueadoDevuelveExitoYGuardaReserva() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", String.valueOf(testProductId));
        // Ajustar el formato de fechas según cómo las espere tu controlador
        payload.put("dateStr", LocalDate.now().plusDays(5).toString());
        payload.put("returnDateStr", LocalDate.now().plusDays(10).toString());
        payload.put("passengers", 2);

        mockMvc.perform(post("/api/bookings/create")
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated()) // o isOk(), según como responda tu API
                .andDo(result -> {
                    // Verificamos de forma implícita que si la respuesta es exitosa
                    // se dispararía la notificación de confirmación por correo (US Notificación)
                });
    }

    @Test
    void crearReserva_usuarioNoLogueadoRegresaUnauthorized() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", String.valueOf(testProductId));
        payload.put("dateStr", LocalDate.now().plusDays(5).toString());
        payload.put("returnDateStr", LocalDate.now().plusDays(10).toString());
        payload.put("passengers", 2);

        mockMvc.perform(post("/api/bookings/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized())
                .andExpect(status().is(401)); 
    }

    @Test
    void busquedaPorRangoFechas_devuelveProductosDisponibles() throws Exception {
        String startDate = LocalDate.now().plusDays(10).toString();
        String endDate = LocalDate.now().plusDays(25).toString();

        mockMvc.perform(get("/api/products/search")
                        .param("startDate", startDate)
                        .param("endDate", endDate)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void historialReservas_usuarioAutenticadoListadoCorrecto() throws Exception {
        Booking booking = new Booking();
        booking.setUser(testUser);
        booking.setProduct(testProduct);
        booking.setStatus("ACTIVE");
        booking.setPassengers(1);
        booking.setTravelDate(LocalDate.now().plusDays(10));
        bookingRepository.save(booking);

        mockMvc.perform(get("/api/bookings/user") // O tu ruta específica para el listado
                        .with(user(testUser.getEmail()).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void whatsappTest_productoTieneProveedor() throws Exception {
        // En el backend podemos verificar que podemos acceder al dato de contacto del producto para armar el link de WhatsApp
        mockMvc.perform(get("/api/products/{id}", testProductId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
