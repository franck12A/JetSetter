package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.UserRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.AuthService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
        res.put("user", newUser);

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
            user.setPassword(null); // por seguridad
            return ResponseEntity.ok(response);
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
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



    // Listar todos los usuarios
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(authService.getAllUsers());
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


    // Otorgar rol ADMIN a un usuario mediante email y password









}
