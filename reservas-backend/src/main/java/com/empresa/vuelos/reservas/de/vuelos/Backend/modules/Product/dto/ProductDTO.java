package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ProductDTO {

    private String name;

    @JsonAlias({"origen"})
    @NotBlank(message = "El origen es obligatorio")
    @Size(max = 80, message = "El origen no puede superar los 80 caracteres")
    private String origin;

    @JsonAlias({"destino", "country"})
    @NotBlank(message = "El destino es obligatorio")
    @Size(max = 80, message = "El destino no puede superar los 80 caracteres")
    private String destination;

    @JsonAlias({"aerolinea"})
    @NotBlank(message = "La aerolinea es obligatoria")
    @Size(max = 60, message = "La aerolinea no puede superar los 60 caracteres")
    private String airline;

    @JsonAlias({"numeroVuelo"})
    @NotBlank(message = "El numero de vuelo es obligatorio")
    @Size(max = 16, message = "El numero de vuelo no puede superar los 16 caracteres")
    private String flightNumber;

    private String description;

    @NotNull(message = "El precio es obligatorio")
    @Positive(message = "El precio debe ser mayor a 0")
    private Double price;

    private String image;

    @NotNull(message = "La categoria es obligatoria")
    private Long categoryId;

    private String country;

    @NotBlank(message = "La fecha de salida es obligatoria")
    private String departureDate;

    private List<FeatureDTO> features;

    private List<String> imagesBase64;

    private String status;

    public ProductDTO() {}

    public ProductDTO(String name, String origin, String destination, String airline, String flightNumber,
                      String description, Double price, String image, Long categoryId, String country,
                      String departureDate, List<FeatureDTO> features, List<String> imagesBase64, String status) {
        this.name = name;
        this.origin = origin;
        this.destination = destination;
        this.airline = airline;
        this.flightNumber = flightNumber;
        this.description = description;
        this.price = price;
        this.image = image;
        this.categoryId = categoryId;
        this.country = country;
        this.departureDate = departureDate;
        this.features = features;
        this.imagesBase64 = imagesBase64;
        this.status = status;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getAirline() { return airline; }
    public void setAirline(String airline) { this.airline = airline; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
