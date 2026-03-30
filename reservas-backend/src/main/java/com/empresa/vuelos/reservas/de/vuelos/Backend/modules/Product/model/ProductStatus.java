package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model;

public enum ProductStatus {
    DRAFT,
    ACTIVE;

    public static ProductStatus from(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return DRAFT;
        }

        try {
            return ProductStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("El estado del vuelo debe ser DRAFT o ACTIVE.");
        }
    }

    public boolean isPubliclyVisible() {
        return this == ACTIVE;
    }
}
