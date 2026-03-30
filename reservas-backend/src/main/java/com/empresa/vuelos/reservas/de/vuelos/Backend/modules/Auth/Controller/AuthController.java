package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.RoleUpdateRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.DTO.UserRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRequest request) {
        try {
            User newUser = authService.register(request);
            Map<String, Object> res = new HashMap<>();
            res.put("message", "Registro exitoso, email enviado");
            res.put("user", toSafeUser(newUser));
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "No se pudo registrar el usuario"));
        }
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmation(@Valid @RequestBody Map<String, String> payload) {
        try {
            String email = payload != null ? payload.get("email") : null;
            authService.resendConfirmationEmail(email);
            return ResponseEntity.ok(Map.of("message", "Email de confirmacion reenviado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "No se pudo reenviar el email"));
        }
    }

    @PostMapping("/login/token")
    public ResponseEntity<?> loginWithToken(@Valid @RequestBody Map<String, String> credentials) {
        try {
            String email = credentials != null ? credentials.get("email") : null;
            String password = credentials != null ? credentials.get("password") : null;

            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email es obligatorio"));
            }
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contrasena es obligatoria"));
            }

            Map<String, Object> response = authService.loginWithToken(email, password);
            User user = (User) response.get("user");

            Map<String, Object> safeResponse = new HashMap<>();
            safeResponse.put("token", response.get("token"));
            safeResponse.put("user", toSafeUser(user));

            return ResponseEntity.ok(safeResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId,
                                            @Valid @RequestBody(required = false) RoleUpdateRequest request,
                                            @RequestParam(required = false) String role,
                                            Authentication authentication) {
        try {
            String requestedRole = request != null && request.getRole() != null ? request.getRole() : role;
            User updatedUser = authService.updateUserRole(userId, requestedRole, authentication != null ? authentication.getName() : null);
            return ResponseEntity.ok(toSafeUser(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            authService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "Usuario eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
