package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.dto;

public class BookingRequest {
    public Long userId;
    public Object productId;
    public String dateStr; // o "date"
    public String returnDateStr;
    public int passengers = 1;
}
