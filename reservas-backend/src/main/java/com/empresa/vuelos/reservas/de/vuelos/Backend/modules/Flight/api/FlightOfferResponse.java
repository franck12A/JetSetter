package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.catalog.DemoDestinationCatalog;

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
    private String originCity;
    private String destinationCity;
    private String originCountry;
    private String destinationCountry;
    private String originCountryCode;
    private String destinationCountryCode;
    private String originAirport;
    private String destinationAirport;
    private String departureAt;
    private String arrivalAt;
    private String airlineName;
    private String airlineCode;
    private String flightNumber;
    private String duration;
    private int stops;
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
    public String getOriginCity() { return originCity; }
    public void setOriginCity(String originCity) { this.originCity = originCity; }
    public String getOriginDisplayCity() { return displayCity(origin); }
    public String getDestinationCity() { return destinationCity; }
    public void setDestinationCity(String destinationCity) { this.destinationCity = destinationCity; }
    public String getDestinationDisplayCity() { return displayCity(destination); }
    public String getOriginCountry() { return originCountry; }
    public void setOriginCountry(String originCountry) { this.originCountry = originCountry; }
    public String getOriginDisplayCountry() { return displayCountry(origin); }
    public String getDestinationCountry() { return destinationCountry; }
    public void setDestinationCountry(String destinationCountry) { this.destinationCountry = destinationCountry; }
    public String getDestinationDisplayCountry() { return displayCountry(destination); }
    public String getOriginCountryCode() { return originCountryCode; }
    public void setOriginCountryCode(String originCountryCode) { this.originCountryCode = originCountryCode; }
    public String getDestinationCountryCode() { return destinationCountryCode; }
    public void setDestinationCountryCode(String destinationCountryCode) { this.destinationCountryCode = destinationCountryCode; }
    public String getOriginAirport() { return originAirport; }
    public void setOriginAirport(String originAirport) { this.originAirport = originAirport; }
    public String getDestinationAirport() { return destinationAirport; }
    public void setDestinationAirport(String destinationAirport) { this.destinationAirport = destinationAirport; }
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
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public int getStops() { return stops; }
    public void setStops(int stops) { this.stops = Math.max(stops, 0); }
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

    private String displayCity(String airportCode) {
        DemoDestinationCatalog.Destination location = DemoDestinationCatalog.find(airportCode);
        return location == null ? null : location.displayCity();
    }

    private String displayCountry(String airportCode) {
        DemoDestinationCatalog.Destination location = DemoDestinationCatalog.find(airportCode);
        return location == null ? null : location.displayCountry();
    }
}
