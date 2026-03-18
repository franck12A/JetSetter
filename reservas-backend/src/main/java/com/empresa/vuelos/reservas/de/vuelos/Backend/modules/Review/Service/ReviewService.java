package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Model.Review;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Repository.ReviewRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Repository.ReviewSummaryProjection;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.dto.ReviewSummaryResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         UserRepository userRepository,
                         ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public Review createOrUpdateReview(Long userId, String productId, int rating, String comment) throws Exception {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("La puntuacion debe estar entre 1 y 5.");
        }

        Long resolvedProductId = resolveProductId(productId);

        boolean hasBooking = bookingRepository.existsByUserIdAndProductId(userId, resolvedProductId);
        if (!hasBooking) {
            throw new IllegalStateException("Debes tener una reserva finalizada para valorar este vuelo.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));
        Product product = productRepository.findById(resolvedProductId)
                .orElseThrow(() -> new Exception("Vuelo no encontrado"));

        Optional<Review> existing = reviewRepository.findByProductIdAndUserId(resolvedProductId, userId);
        Review review = existing.orElseGet(Review::new);
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByProduct(String productId) throws Exception {
        Long resolvedProductId = resolveProductId(productId);
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(resolvedProductId);
    }

    public List<ReviewSummaryResponse> getSummaries(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return List.of();

        List<ReviewSummaryProjection> summaries = reviewRepository.findSummaryByProductIds(productIds);
        Map<Long, ReviewSummaryResponse> map = new HashMap<>();

        for (ReviewSummaryProjection projection : summaries) {
            ReviewSummaryResponse response = new ReviewSummaryResponse();
            response.productId = projection.getProductId();
            response.averageRating = projection.getAverage() != null ? projection.getAverage() : 0;
            response.totalReviews = projection.getTotal() != null ? projection.getTotal() : 0;
            map.put(response.productId, response);
        }

        return productIds.stream().map(id -> {
            ReviewSummaryResponse response = map.get(id);
            if (response != null) return response;
            ReviewSummaryResponse empty = new ReviewSummaryResponse();
            empty.productId = id;
            empty.averageRating = 0;
            empty.totalReviews = 0;
            return empty;
        }).toList();
    }

    private Long resolveProductId(String rawProductId) throws Exception {
        if (rawProductId == null || rawProductId.trim().isEmpty()) {
            throw new IllegalArgumentException("productId es obligatorio");
        }

        String value = rawProductId.trim();

        try {
            Long numericId = Long.parseLong(value);
            Optional<Product> byId = productRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get().getId();
            }
        } catch (NumberFormatException ignored) {
        }

        Product product = productRepository.findByExternalId(value)
                .orElseThrow(() -> new Exception("Vuelo no encontrado para productId/externalId: " + value));
        return product.getId();
    }
}
