package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Model.Review;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.Service.ReviewService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.dto.ReviewRequest;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.dto.ReviewResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Review.dto.ReviewSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    public ReviewController(ReviewService reviewService, UserRepository userRepository) {
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable String productId) throws Exception {
        List<Review> reviews = reviewService.getReviewsByProduct(productId);
        return ResponseEntity.ok(reviews.stream().map(this::toResponse).toList());
    }

    @GetMapping("/summary")
    public ResponseEntity<List<ReviewSummaryResponse>> getSummary(@RequestParam List<Long> productIds) {
        return ResponseEntity.ok(reviewService.getSummaries(productIds));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request,
                                                       Authentication authentication) throws Exception {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Review review = reviewService.createOrUpdateReview(user.getId(), request.productId, request.rating, request.comment);
        return ResponseEntity.ok(toResponse(review));
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.id = review.getId();
        response.productId = review.getProduct() != null ? review.getProduct().getId() : null;
        response.userId = review.getUser() != null ? review.getUser().getId() : null;
        response.userName = review.getUser() != null
                ? (review.getUser().getFirstName() + " " + review.getUser().getLastName()).trim()
                : "Usuario";
        response.rating = review.getRating();
        response.comment = review.getComment();
        response.createdAt = review.getCreatedAt();
        return response;
    }
}
