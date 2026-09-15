package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api;

import java.util.ArrayList;
import java.util.List;

/** Stable JSON contract for JetSetter clients; it deliberately contains no provider SDK type. */
public class FlightOfferResponse {
    private String id;
    private Long productId;
    private String provider;
    private String externalId;
    private String origin;
    private String destination;
    private String departureAt;
    private String arrivalAt;
    private String airlineName;
    private String airlineCode;
    private String flightNumber;
    private double totalAmount;
    private String currency;
    private String queriedAt;
    private String expiresAt;
    private List<FlightSegmentResponse> segments = new ArrayList<>();

    // Compatibility aliases consumed by the existing React views.
    public String getOrigen() { return origin; }
    public String getDestino() { return destination; }
    public String getFechaSalida() { return departureAt; }
    public String getFechaLlegada() { return arrivalAt; }
    public String getAerolinea() { return airlineName; }
    public String getNumeroVuelo() { return flightNumber; }
    public double getPrecioTotal() { return totalAmount; }
    public List<java.util.Map<String, Object>> getSegmentos() {
        return segments.stream().map(segment -> java.util.Map.<String, Object>of(
                "origen", value(segment.getOrigin()), "destino", value(segment.getDestination()),
                "salida", value(segment.getDepartureAt()), "llegada", value(segment.getArrivalAt()),
                "aerolinea", value(segment.getAirlineName()), "numeroVuelo", value(segment.getFlightNumber())
        )).toList();
    }
    private static String value(String value) { return value == null ? "" : value; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getDepartureAt() { return departureAt; }
    public void setDepartureAt(String departureAt) { this.departureAt = departureAt; }
    public String getArrivalAt() { return arrivalAt; }
    public void setArrivalAt(String arrivalAt) { this.arrivalAt = arrivalAt; }
    public String getAirlineName() { return airlineName; }
    public void setAirlineName(String airlineName) { this.airlineName = airlineName; }
    public String getAirlineCode() { return airlineCode; }
    public void setAirlineCode(String airlineCode) { this.airlineCode = airlineCode; }
    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getQueriedAt() { return queriedAt; }
    public void setQueriedAt(String queriedAt) { this.queriedAt = queriedAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public List<FlightSegmentResponse> getSegments() { return segments; }
    public void setSegments(List<FlightSegmentResponse> segments) { this.segments = segments == null ? new ArrayList<>() : new ArrayList<>(segments); }
}
