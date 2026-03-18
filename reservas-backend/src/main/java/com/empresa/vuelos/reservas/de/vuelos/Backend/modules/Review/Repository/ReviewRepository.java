package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT r.product.id as productId, AVG(r.rating) as average, COUNT(r) as total " +
            "FROM Review r WHERE r.product.id IN :productIds GROUP BY r.product.id")
    List<ReviewSummaryProjection> findSummaryByProductIds(@Param("productIds") List<Long> productIds);
}
