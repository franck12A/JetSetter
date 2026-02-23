package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model.Category;
import jakarta.persistence.*;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // ← AUTOGENERADO
    private Long id;

    @Setter
    @Column(unique = true)
    private String externalId;


    @Setter
    private String name;

    @Setter
    private String description;

    @Setter
    private String image;

    @Setter
    private double price;

    @Setter
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Setter
    private String country;

    @Setter
    private LocalDateTime departureDate;

    @Setter
    private LocalDateTime createdAt = LocalDateTime.now();

    @Setter
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ElementCollection
    @Lob
    private List<String> imagesBase64;

    @Lob
    @Column
    private String segmentosJson;  // JSON de los segmentos

    @Lob
    @Column
    private String imagenesUrlsJson;  // JSON de todas las URLs de imágenes

    @Setter
    private String aerolinea;

    @Setter
    private String numeroVuelo;


    @ManyToMany
    @JoinTable(
            name = "product_features",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id")
    )
    private Set<Feature> features = new HashSet<>();

    public Set<Feature> getFeatures() { return features; }
    public void setFeatures(Set<Feature> features) { this.features = features; }
    public void setImagesBase64(List<String> imagesBase64) { this.imagesBase64 = imagesBase64; }

    @Setter
    @ManyToMany(mappedBy = "favorites")
    private Set<User> favoritedBy = new HashSet<>();
    public Set<User> getFavoritedBy() { return favoritedBy; }

    // Getters
    public Long getId() { return id; }
    public String getExternalId() { return externalId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getImage() { return image; }
    public double getPrice() { return price; }
    public Category getCategory() { return category; }
    public String getCountry() { return country; }
    public LocalDateTime getDepartureDate() { return departureDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<String> getImagesBase64() { return imagesBase64; }

    public String getAerolinea() { return aerolinea; }
    public String getNumeroVuelo() { return numeroVuelo; }

    public String getSegmentosJson() { return segmentosJson; }
    public void setSegmentosJson(String segmentosJson) { this.segmentosJson = segmentosJson; }

    public String getImagenesUrlsJson() { return imagenesUrlsJson; }
    public void setImagenesUrlsJson(String imagenesUrlsJson) { this.imagenesUrlsJson = imagenesUrlsJson; }
}
