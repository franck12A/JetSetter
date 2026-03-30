package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Repository;


import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.Model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByTravelDateAscBookingDateDesc(Long userId);
    List<Booking> findByProductId(Long productId);
    List<Booking> findByUserIdAndProductId(Long userId, Long productId);
    boolean existsByProductIdAndTravelDate(Long productId, LocalDate travelDate);
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    @Query("""
            select (count(b) > 0)
            from Booking b
            where b.product.id = :productId
              and b.travelDate <= :endDate
              and coalesce(b.returnDate, b.travelDate) >= :startDate
            """)
    boolean existsOverlappingBooking(@Param("productId") Long productId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);
}
