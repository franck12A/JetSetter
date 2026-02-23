package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.AuthService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.DTO.FavoriteRequestDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Model.Favorite;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Service.FavoriteService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.ProductService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;


@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteService favoriteService, UserRepository userRepository) {
        this.favoriteService = favoriteService;
        this.userRepository = userRepository;
    }

    // Agregar favorito
    @PostMapping
    public ResponseEntity<String> addFavorite(@RequestBody FavoriteRequest request,
                                              Authentication authentication) {
        String email = authentication.getName();
        System.out.println("🔑 Usuario logueado: " + email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        favoriteService.addFavorite(user.getId(), request.getProductId());
        return ResponseEntity.ok("Favorito agregado correctamente");
    }

    // Obtener favoritos del usuario logueado
    @GetMapping
    public ResponseEntity<List<Product>> getFavorites(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Pasar el ID del usuario, no el objeto completo
        return ResponseEntity.ok(favoriteService.getFavorites(user.getId()));
    }



    // Eliminar favorito
    @DeleteMapping
    public ResponseEntity<String> removeFavorite(@RequestBody FavoriteRequest request,
                                                 Authentication authentication) {
        String email = authentication.getName();
        System.out.println("❌ Usuario eliminando favorito: " + email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        favoriteService.removeFavorite(user.getId(), request.getProductId());
        return ResponseEntity.ok("Favorito eliminado correctamente");
    }

    // DTO simple
    public static class FavoriteRequest {
        private Long productId;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
    }
}