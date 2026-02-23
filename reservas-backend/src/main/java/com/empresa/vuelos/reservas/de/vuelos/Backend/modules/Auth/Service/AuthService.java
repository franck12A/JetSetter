package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.JwtService;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.UserRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.Role;

import java.util.*;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final EmailService emailService;





    public AuthService(UserRepository userRepository, ProductRepository productRepository, JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @PostConstruct
    public void initAdmin() {
        String adminEmail = "admin@vuelos.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("Admin1234"));
            admin.setFirstName("Administrador"); // obligatorio
            admin.setLastName("Global");          // obligatorio
            admin.setRole(Role.ROLE_ADMIN);       // obligatorio
            userRepository.save(admin);
            System.out.println("✅ Usuario administrador creado: " + adminEmail);
        }
    }




    // Registro de usuario
    public User register(UserRequest request) {
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        // enviar email automáticamente
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        return user;
    }



    // Login
    public User login(String email, String password) throws Exception {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if(optionalUser.isEmpty()) {
            throw new Exception("Usuario no encontrado");
        }
        User user = optionalUser.get();
        if(!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Contraseña incorrecta");
        }
        return user;
    }

    // ===== FAVORITOS =====

    // Obtener favoritos de un usuario
    public Set<Product> getFavorites(Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));
        return user.getFavorites();
    }

    // Agregar un producto a favoritos
    public User addFavorite(Long userId, Long productId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Producto no encontrado"));

        Set<Product> favorites = user.getFavorites();
        if(favorites == null) favorites = new HashSet<>();
        favorites.add(product);
        user.setFavorites(favorites);

        return userRepository.save(user);
    }

    // Quitar un producto de favoritos
    public User removeFavorite(Long userId, Long productId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Producto no encontrado"));

        Set<Product> favorites = user.getFavorites();
        if(favorites != null) {
            favorites.remove(product);
            user.setFavorites(favorites);
        }

        return userRepository.save(user);
    }

    public User updateUserRole(Long userId, String roleName) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));

        // 🚫 Evita que el super admin pierda privilegios
        if (user.getEmail().equals("admin@vuelos.com")) {
            throw new Exception("No se puede modificar el rol del super administrador");
        }

        // 🔹 Validación explícita de roles
        if (!roleName.equals("ROLE_ADMIN") && !roleName.equals("ROLE_USER")) {
            throw new Exception("Rol inválido: " + roleName);
        }

        user.setRole(Role.valueOf(roleName));
        return userRepository.save(user);
    }


    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User makeAdminByEmail(String email, String password) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));

        // Validar contraseña
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Contraseña incorrecta");
        }

        // Evitar tocar super admin
        if (user.getEmail().equals("admin@vuelos.com")) {
            throw new Exception("No se puede modificar el super administrador");
        }

        user.setRole(Role.ROLE_ADMIN);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));

        // Evitar borrar al super admin
        if (user.getEmail().equals("admin@vuelos.com")) {
            throw new Exception("No se puede eliminar el super administrador");
        }

        userRepository.delete(user);
    }

    public Map<String, Object> loginWithToken(String email, String password) throws Exception {
        User user = login(email, password); // usamos tu login original

        // obtenemos los roles como lista de string
        List<String> roles = List.of(user.getRole().name());
        String rolesString = String.join(",", roles);

        String token = jwtService.generateToken(user.getEmail(), rolesString);



        // devolvemos mapa con user y token
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", token);

        return response;
    }





}
