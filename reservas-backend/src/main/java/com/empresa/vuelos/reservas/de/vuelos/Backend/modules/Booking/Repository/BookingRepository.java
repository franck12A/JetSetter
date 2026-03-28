package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByProductId(Long productId);
    List<Booking> findByUserIdAndProductId(Long userId, Long productId);
    boolean existsByProductIdAndTravelDate(Long productId, LocalDate travelDate);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
