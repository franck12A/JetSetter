package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.dto;

import java.time.LocalDateTime;

public class ReviewResponse {
    public Long id;
    public Long productId;
    public Long userId;
    public String userName;
    public int rating;
    public String comment;
    public LocalDateTime createdAt;
}
