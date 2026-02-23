package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Favorite.Model;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import jakarta.persistence.*;

@Entity
@Table(name = "favorites")
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    public Favorite() {}

    public Favorite(User user, Product product) {
        this.user = user;
        this.product = product;
    }

    // Getters y Setters
    public String getId() { return id; }
    public User getUser() { return user; }
    public Product getProduct() { return product; }

    public void setId(String id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setProduct(Product product) { this.product = product; }
}