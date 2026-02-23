package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository.UserRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository.BookingRepository;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BookingService   {

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
        booking.setStatus("PENDIENTE");
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
        booking.setStatus("PENDIENTE");

        // Si viene una fecha válida, se usa. Sino, se toma el momento actual.
        if (dateStr != null && !dateStr.isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            booking.setBookingDate(LocalDate.parse(dateStr, formatter).atStartOfDay());
        } else {
            booking.setBookingDate(LocalDateTime.now());
        }

        return bookingRepository.save(booking);
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
}