package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api;

public class FlightSegmentResponse {
    private String origin;
    private String destination;
    private String departureAt;
    private String arrivalAt;
    private String airlineName;
    private String airlineCode;
    private String flightNumber;

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
}
