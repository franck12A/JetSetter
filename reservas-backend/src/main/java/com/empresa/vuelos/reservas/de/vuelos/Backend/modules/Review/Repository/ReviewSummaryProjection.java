package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Repository;

public interface ReviewSummaryProjection {
    Long getProductId();
    Double getAverage();
    Long getTotal();
}
