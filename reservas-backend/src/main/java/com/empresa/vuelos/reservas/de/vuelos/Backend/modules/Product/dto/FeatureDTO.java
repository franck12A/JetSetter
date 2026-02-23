package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
@JsonIgnoreProperties(ignoreUnknown = true)
public class FeatureDTO {
    private Long id; // obligatorio si vamos a usar features existentes

    @NotBlank
    private String name;

    @NotBlank
    private String icon;

    public FeatureDTO() {}

    public FeatureDTO(Long id, String name, String icon) {
        this.id = id;
        this.name = name;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
