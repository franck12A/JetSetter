package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Booking.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BookingRequest {
    public Long userId;

    @NotNull(message = "El producto es obligatorio.")
    public Object productId;

    @NotBlank(message = "La fecha de salida es obligatoria.")
    public String dateStr;

    public String returnDateStr;

    @Min(value = 1, message = "Debe haber al menos un pasajero.")
    @Max(value = 9, message = "No se permiten mas de 9 pasajeros por reserva.")
    public int passengers = 1;
}
