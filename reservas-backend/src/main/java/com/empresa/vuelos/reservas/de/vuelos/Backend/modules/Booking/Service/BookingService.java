package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ProductRepository productRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    // Crear reserva recibiendo un objeto Booking
    public Booking createBooking(Booking booking) {
        // Modo demo: marcamos la reserva como completada al crearla para habilitar valoraciones.
        booking.setStatus("COMPLETADA");
        booking.setBookingDate(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    // Crear reserva usando IDs de usuario y producto
    public Booking createBooking(Long userId, Long productId, String dateStr, int passengers) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("Usuario no encontrado"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Vuelo no encontrado"));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setProduct(product);
        booking.setPassengers(passengers);
        // Modo demo: marcamos la reserva como completada al crearla para habilitar valoraciones.
        booking.setStatus("COMPLETADA");

        LocalDateTime travelDateTime = (dateStr != null && !dateStr.isEmpty())
                ? parseBookingDate(dateStr)
                : LocalDateTime.now();
        LocalDate travelDate = travelDateTime.toLocalDate();

        validateAvailability(productId, travelDate);

        booking.setBookingDate(LocalDateTime.now());
        booking.setTravelDate(travelDate);

        try {
            return bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("La fecha seleccionada ya tiene una reserva para este vuelo.");
        }
    }

    public Long resolveProductId(Object rawProductId) throws Exception {
        if (rawProductId == null) {
            throw new IllegalArgumentException("productId es obligatorio");
        }

        String value = String.valueOf(rawProductId).trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("productId es obligatorio");
        }

        try {
            Long numericId = Long.parseLong(value);
            Optional<Product> byId = productRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get().getId();
            }
        } catch (NumberFormatException ignored) {
            // No era numérico: seguimos con externalId.
        }

        Product product = productRepository.findByExternalId(value)
                .orElseThrow(() -> new Exception("Vuelo no encontrado para productId/externalId: " + value));
        return product.getId();
    }

    // Obtener todas las reservas
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Obtener reservas por usuario
    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    // Cancelar (eliminar) reserva
    public void cancelBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    public List<String> getBookedDatesByProductId(Long productId) {
        return bookingRepository.findByProductId(productId).stream()
                .map(booking -> {
                    LocalDate travelDate = booking.getTravelDate();
                    if (travelDate != null) return travelDate;
                    LocalDateTime bookingDate = booking.getBookingDate();
                    return bookingDate != null ? bookingDate.toLocalDate() : null;
                })
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .map(LocalDate::toString)
                .toList();
    }

    private void validateAvailability(Long productId, LocalDate travelDate) {
        if (travelDate == null) {
            throw new IllegalArgumentException("La fecha de viaje es obligatoria.");
        }

        if (bookingRepository.existsByProductIdAndTravelDate(productId, travelDate)) {
            throw new IllegalStateException("La fecha seleccionada ya tiene una reserva para este vuelo.");
        }

        boolean duplicatedLegacyDate = bookingRepository.findByProductId(productId).stream()
                .anyMatch(booking -> {
                    LocalDate legacyDate = booking.getTravelDate();
                    if (legacyDate != null) return false;
                    LocalDateTime bookingDate = booking.getBookingDate();
                    return bookingDate != null && travelDate.equals(bookingDate.toLocalDate());
                });

        if (duplicatedLegacyDate) {
            throw new IllegalStateException("La fecha seleccionada ya tiene una reserva para este vuelo.");
        }
    }

    private LocalDateTime parseBookingDate(String rawDate) {
        String value = rawDate.trim();
        if (value.isEmpty()) return LocalDateTime.now();

        List<DateTimeFormatter> localDateFormats = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,          // yyyy-MM-dd
                DateTimeFormatter.ofPattern("dd/MM/yyyy"), // 11/03/2026
                DateTimeFormatter.ofPattern("d/M/yyyy")    // 11/3/2026
        );

        for (DateTimeFormatter formatter : localDateFormats) {
            try {
                return LocalDate.parse(value, formatter).atStartOfDay();
            } catch (DateTimeParseException ignored) {
            }
        }

        List<DateTimeFormatter> dateTimeFormats = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,     // 2026-03-11T10:00:00
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"),
                DateTimeFormatter.ofPattern("d/M/yyyy HH:mm"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
                DateTimeFormatter.ofPattern("d/M/yyyy HH:mm:ss")
        );

        for (DateTimeFormatter formatter : dateTimeFormats) {
            try {
                return LocalDateTime.parse(value, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        throw new IllegalArgumentException("Formato de fecha invalido: " + rawDate);
    }
}
