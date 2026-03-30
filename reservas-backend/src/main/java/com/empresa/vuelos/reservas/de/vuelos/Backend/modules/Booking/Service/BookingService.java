package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail.EmailService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.ProductStatus;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ProductRepository productRepository,
                          EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    public Booking createBooking(Booking booking) {
        booking.setStatus("CONFIRMADA");
        booking.setBookingDate(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking createBooking(Long userId, Long productId, String dateStr, String returnDateStr, int passengers) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Vuelo no encontrado."));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("El vuelo no esta disponible para reservar.");
        }

        if (passengers < 1 || passengers > 9) {
            throw new IllegalArgumentException("La cantidad de pasajeros es invalida.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setProduct(product);
        booking.setPassengers(passengers);
        booking.setStatus("CONFIRMADA");

        LocalDateTime travelDateTime = parseBookingDate(dateStr);
        LocalDate travelDate = travelDateTime.toLocalDate();
        LocalDate returnDate = null;

        if (returnDateStr != null && !returnDateStr.isBlank()) {
            returnDate = parseBookingDate(returnDateStr).toLocalDate();
        }

        validateDates(travelDate, returnDate);
        validateAvailability(productId, travelDate, returnDate);

        booking.setBookingDate(LocalDateTime.now());
        booking.setTravelDate(travelDate);
        booking.setReturnDate(returnDate);

        try {
            Booking saved = bookingRepository.saveAndFlush(booking);
            sendBookingConfirmation(saved);
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Las fechas seleccionadas ya no estan disponibles para este vuelo.");
        }
    }

    public Long resolveProductId(Object rawProductId) {
        if (rawProductId == null) {
            throw new IllegalArgumentException("productId es obligatorio.");
        }

        String value = String.valueOf(rawProductId).trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("productId es obligatorio.");
        }

        try {
            Long numericId = Long.parseLong(value);
            Optional<Product> byId = productRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get().getId();
            }
        } catch (NumberFormatException ignored) {
        }

        Product product = productRepository.findByExternalId(value)
                .orElseThrow(() -> new IllegalArgumentException("Vuelo no encontrado para el identificador indicado."));
        return product.getId();
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdOrderByTravelDateAscBookingDateDesc(userId);
    }

    public void cancelBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    public List<String> getBookedDatesByProductId(Long productId) {
        return bookingRepository.findByProductId(productId).stream()
                .flatMap(booking -> expandBookedDates(booking).stream())
                .distinct()
                .sorted()
                .map(LocalDate::toString)
                .toList();
    }

    private void validateDates(LocalDate travelDate, LocalDate returnDate) {
        if (travelDate == null) {
            throw new IllegalArgumentException("La fecha de viaje es obligatoria.");
        }

        LocalDate today = LocalDate.now();
        if (travelDate.isBefore(today)) {
            throw new IllegalArgumentException("No se pueden reservar fechas pasadas.");
        }

        if (returnDate != null && returnDate.isBefore(travelDate)) {
            throw new IllegalArgumentException("La fecha de regreso no puede ser anterior a la salida.");
        }
    }

    private void validateAvailability(Long productId, LocalDate travelDate, LocalDate returnDate) {
        LocalDate effectiveReturnDate = returnDate != null ? returnDate : travelDate;

        if (bookingRepository.existsOverlappingBooking(productId, travelDate, effectiveReturnDate)) {
            throw new IllegalStateException("El rango seleccionado incluye fechas no disponibles para este vuelo.");
        }

        boolean duplicatedLegacyDate = bookingRepository.findByProductId(productId).stream()
                .flatMap(booking -> expandBookedDates(booking).stream())
                .anyMatch(bookedDate -> !bookedDate.isBefore(travelDate) && !bookedDate.isAfter(effectiveReturnDate));

        if (duplicatedLegacyDate) {
            throw new IllegalStateException("El rango seleccionado incluye fechas no disponibles para este vuelo.");
        }
    }

    private LocalDateTime parseBookingDate(String rawDate) {
        String value = rawDate != null ? rawDate.trim() : "";
        if (value.isEmpty()) {
            throw new IllegalArgumentException("La fecha es obligatoria.");
        }

        List<DateTimeFormatter> localDateFormats = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );

        for (DateTimeFormatter formatter : localDateFormats) {
            try {
                return LocalDate.parse(value, formatter).atStartOfDay();
            } catch (DateTimeParseException ignored) {
            }
        }

        List<DateTimeFormatter> dateTimeFormats = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
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

    private List<LocalDate> expandBookedDates(Booking booking) {
        LocalDate start = booking.getTravelDate();
        if (start == null) {
            LocalDateTime bookingDate = booking.getBookingDate();
            if (bookingDate == null) return List.of();
            start = bookingDate.toLocalDate();
        }

        LocalDate end = booking.getReturnDate() != null ? booking.getReturnDate() : start;
        if (end.isBefore(start)) {
            end = start;
        }

        return start.datesUntil(end.plusDays(1)).toList();
    }

    private void sendBookingConfirmation(Booking booking) {
        if (booking == null || booking.getUser() == null || booking.getProduct() == null) {
            return;
        }

        User user = booking.getUser();
        Product product = booking.getProduct();
        String customerName = String.format("%s %s",
                user.getFirstName() != null ? user.getFirstName().trim() : "",
                user.getLastName() != null ? user.getLastName().trim() : "").trim();
        String productName = product.getName() != null && !product.getName().isBlank()
                ? product.getName()
                : String.format("%s -> %s", product.getAerolinea(), product.getCountry());

        emailService.sendBookingConfirmationEmail(
                user.getEmail(),
                customerName.isBlank() ? user.getEmail() : customerName,
                productName,
                booking.getBookingDate(),
                booking.getTravelDate(),
                booking.getReturnDate(),
                product.getAerolinea(),
                product.getNumeroVuelo()
        );
    }
}
