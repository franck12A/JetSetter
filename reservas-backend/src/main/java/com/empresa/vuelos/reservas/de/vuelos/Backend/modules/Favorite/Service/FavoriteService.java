package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Model.Favorite;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Repository.FavoriteRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.Service.ProductService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.*;


@Service
public class FavoriteService {

    private final UserRepository userRepository;
    private final ProductService productService;

    public FavoriteService(UserRepository userRepository, ProductService productService) {
        this.userRepository = userRepository;
        this.productService = productService;
    }

    @Transactional
    public void addFavorite(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Product product = productService.getProductById(productId);
        if (product == null) throw new RuntimeException("Producto no encontrado");

        user.getFavorites().add(product);
        userRepository.save(user);
        System.out.println("✅ Favorito agregado: " + product.getName() + " para usuario " + user.getEmail());
    }

    @Transactional
    public void removeFavorite(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.getFavorites().removeIf(p -> p.getId().equals(productId));
        userRepository.save(user);
        System.out.println("🗑 Favorito eliminado: productId " + productId + " para usuario " + user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<Product> getFavorites(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return new ArrayList<>(user.getFavorites());
    }



}