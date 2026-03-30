package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.JwtService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.UserRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.Role;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Set<String> PROTECTED_ADMIN_EMAILS = Set.of("admin@vuelos.com", "admin@miapp.test");

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       ProductRepository productRepository,
                       JwtService jwtService,
                       EmailService emailService) {
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
            admin.setFirstName("Administrador");
            admin.setLastName("Global");
            admin.setRole(Role.ROLE_ADMIN);
            userRepository.save(admin);
        }
    }

    public User register(UserRequest request) {
        validateRegisterRequest(request);
        String email = request.getEmail().trim();

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        String displayName = buildDisplayName(user);
        emailService.sendWelcomeEmail(user.getEmail(), displayName, user.getEmail());

        return user;
    }

    public User login(String email, String password) throws Exception {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email es obligatorio");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("La contrasena es obligatoria");
        }

        Optional<User> optionalUser = userRepository.findByEmail(email.trim());
        if (optionalUser.isEmpty()) {
            throw new Exception("No existe una cuenta con ese email");
        }
        User user = optionalUser.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("La contrasena no coincide");
        }
        return user;
    }

    public Set<Product> getFavorites(Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("No existe una cuenta con ese email"));
        return user.getFavorites();
    }

    public User addFavorite(Long userId, Long productId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("No existe una cuenta con ese email"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Producto no encontrado"));

        Set<Product> favorites = user.getFavorites();
        if (favorites == null) favorites = new HashSet<>();
        favorites.add(product);
        user.setFavorites(favorites);

        return userRepository.save(user);
    }

    public User removeFavorite(Long userId, Long productId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("No existe una cuenta con ese email"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Producto no encontrado"));

        Set<Product> favorites = user.getFavorites();
        if (favorites != null) {
            favorites.remove(product);
            user.setFavorites(favorites);
        }

        return userRepository.save(user);
    }

    public User updateUserRole(Long userId, String roleName, String actorEmail) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));

        if (user.getEmail() != null && user.getEmail().equalsIgnoreCase(actorEmail)) {
            throw new IllegalArgumentException("No puedes cambiar tu propio rol desde esta pantalla.");
        }
        if (isProtectedAdminEmail(user.getEmail())) {
            throw new IllegalArgumentException("No se puede modificar el rol de este administrador protegido.");
        }

        user.setRole(normalizeRole(roleName));
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User makeAdminByEmail(String email, String password) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("No existe una cuenta con ese email"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("La contrasena no coincide");
        }
        if (isProtectedAdminEmail(user.getEmail())) {
            throw new Exception("No se puede modificar este administrador protegido");
        }

        user.setRole(Role.ROLE_ADMIN);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("No existe una cuenta con ese email"));

        if (isProtectedAdminEmail(user.getEmail())) {
            throw new Exception("No se puede eliminar este administrador protegido");
        }

        userRepository.delete(user);
    }

    public Map<String, Object> loginWithToken(String email, String password) throws Exception {
        User user = login(email, password);
        List<String> roles = List.of(user.getRole().name());
        String rolesString = String.join(",", roles);
        String token = jwtService.generateToken(user.getEmail(), rolesString);

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", token);
        return response;
    }

    public void resendConfirmationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email es obligatorio");
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("El email no es valido");
        }

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("No existe una cuenta con ese email"));

        String displayName = buildDisplayName(user);
        emailService.sendWelcomeEmail(user.getEmail(), displayName, user.getEmail());
    }

    private Role normalizeRole(String roleName) {
        String normalized = roleName != null ? roleName.trim().toUpperCase() : "";
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("El rol es obligatorio.");
        }
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Rol invalido: " + roleName);
        }
    }

    private boolean isProtectedAdminEmail(String email) {
        return email != null && PROTECTED_ADMIN_EMAILS.contains(email.toLowerCase());
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String displayName = (firstName + " " + lastName).trim();
        return displayName.isEmpty() ? "Usuario" : displayName;
    }

    private void validateRegisterRequest(UserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Datos de registro invalidos");
        }

        String firstName = request.getFirstName() != null ? request.getFirstName().trim() : "";
        String lastName = request.getLastName() != null ? request.getLastName().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";
        String confirmPassword = request.getConfirmPassword() != null ? request.getConfirmPassword().trim() : "";

        if (firstName.isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (lastName.isEmpty()) {
            throw new IllegalArgumentException("El apellido es obligatorio");
        }
        if (email.isEmpty()) {
            throw new IllegalArgumentException("El email es obligatorio");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("El email no es valido");
        }
        if (password.isEmpty()) {
            throw new IllegalArgumentException("La contrasena es obligatoria");
        }
        if (password.length() < 6) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
        }
        if (confirmPassword.isEmpty()) {
            throw new IllegalArgumentException("La confirmacion de contrasena es obligatoria");
        }
        if (!confirmPassword.equals(password)) {
            throw new IllegalArgumentException("Las contrasenas no coinciden");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("El email ya esta registrado");
        }
    }
}
