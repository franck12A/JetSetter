package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.util.List;

public class ProductDTO {

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @Positive
    private double price;

    private String image;

    // 🔥 ESTA ES LA ÚNICA MANERA CORRECTA DE ENVIAR CATEGORÍA
    private Long categoryId;

    private String country;

    private String departureDate;

    private List<FeatureDTO> features;

    private List<String> imagesBase64;

    public ProductDTO() {}

    public ProductDTO(String name, String description, double price, String image,
                      Long categoryId, String country, String departureDate,
                      List<FeatureDTO> features, List<String> imagesBase64) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.image = image;
        this.categoryId = categoryId;
        this.country = country;
        this.departureDate = departureDate;
        this.features = features;
        this.imagesBase64 = imagesBase64;
    }

    // Getters y Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getDepartureDate() { return departureDate; }
    public void setDepartureDate(String departureDate) { this.departureDate = departureDate; }

    public List<FeatureDTO> getFeatures() { return features; }
    public void setFeatures(List<FeatureDTO> features) { this.features = features; }

    public List<String> getImagesBase64() { return imagesBase64; }
    public void setImagesBase64(List<String> imagesBase64) { this.imagesBase64 = imagesBase64; }
}
