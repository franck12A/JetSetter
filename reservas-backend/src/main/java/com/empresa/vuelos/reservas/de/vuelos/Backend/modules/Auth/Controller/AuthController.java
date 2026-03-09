package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.UserRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.AuthService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;


    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    // Registro
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRequest request) {

        // 1. Crear usuario
        User newUser = authService.register(request);

        // 2. Enviar email HTML (tipo Airbnb)
        emailService.sendWelcomeEmail(newUser.getEmail(), newUser.getFirstName());

        // 3. Devolver respuesta al frontend
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Registro exitoso, email enviado");
        res.put("user", toSafeUser(newUser));

        return ResponseEntity.ok(res);
    }


    // Login
    @PostMapping("/login/token")
    public ResponseEntity<?> loginWithToken(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            Map<String, Object> response = authService.loginWithToken(email, password);
            User user = (User) response.get("user");

            Map<String, Object> safeResponse = new HashMap<>();
            safeResponse.put("token", response.get("token"));
            safeResponse.put("user", toSafeUser(user));

            return ResponseEntity.ok(safeResponse);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }



    // ===== ADMIN ROLES =====
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role
    ) {
        try {
            User updatedUser = authService.updateUserRole(userId, role.toUpperCase());
            return ResponseEntity.ok(toSafeUser(updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



    // Listar todos los usuarios
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = authService.getAllUsers();
            List<Map<String, Object>> safeUsers = new ArrayList<>();

            for (User user : users) {
                safeUsers.add(toSafeUser(user));
            }

            return ResponseEntity.ok(safeUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Solo ADMIN puede eliminar usuarios
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            authService.deleteUser(userId);
            return ResponseEntity.ok("Usuario eliminado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    private Map<String, Object> toSafeUser(User user) {
        Map<String, Object> safe = new HashMap<>();
        safe.put("id", user.getId());
        safe.put("firstName", user.getFirstName());
        safe.put("lastName", user.getLastName());
        safe.put("email", user.getEmail());
        safe.put("role", user.getRole() != null ? user.getRole().name() : null);
        return safe;
    }
}
