package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Service.BookingService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.dto.BookingRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository; // <- inyectamos

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository; // <- asignamos
    }

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Booking>> getBookings(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(bookingService.getBookingsByUser(user.getId()));
    }

    @GetMapping("/product/{productId}/dates")
    public ResponseEntity<List<String>> getBookedDatesByProduct(@PathVariable String productId) {
        Long resolvedProductId = bookingService.resolveProductId(productId);
        List<String> dates = bookingService.getBookedDatesByProductId(resolvedProductId);
        return ResponseEntity.ok(dates);
    }

    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request,
                                                 Authentication authentication) throws Exception {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Long resolvedProductId = bookingService.resolveProductId(request.productId);
        Booking booking = bookingService.createBooking(
                user.getId(),
                resolvedProductId,
                request.dateStr,
                request.returnDateStr,
                request.passengers
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @DeleteMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable Long bookingId,
                                                Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Booking booking = bookingService.getBookingsByUser(user.getId()).stream()
                .filter(b -> b.getId().equals(bookingId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada para este usuario"));

        bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(Map.of("message", "Reserva cancelada correctamente"));
    }

}
