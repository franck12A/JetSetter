package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.dto;

import jakarta.validation.constraints.NotBlank;

public class ProductStatusUpdateRequest {

    @NotBlank(message = "El estado es obligatorio")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
