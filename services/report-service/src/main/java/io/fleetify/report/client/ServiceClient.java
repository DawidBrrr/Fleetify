package io.fleetify.report.client;

import io.fleetify.report.dto.AnalyticsData;
import io.fleetify.report.dto.TripData;
import io.fleetify.report.dto.VehicleData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class ServiceClient {

    private final WebClient analyticsClient;
    private final WebClient vehicleClient;
    private final WebClient userClient;

    public ServiceClient(
            @Value("${services.analytics.url}") String analyticsUrl,
            @Value("${services.vehicle.url}") String vehicleUrl,
            @Value("${services.user-management.url}") String userUrl) {
        
        this.analyticsClient = WebClient.builder()
                .baseUrl(analyticsUrl)
                .build();
        
        this.vehicleClient = WebClient.builder()
                .baseUrl(vehicleUrl)
                .build();
        
        this.userClient = WebClient.builder()
                .baseUrl(userUrl)
                .build();
    }

    /**
     * Fetch analytics summary from Analytics Service
     */
    public AnalyticsData fetchAnalyticsSummary(String authorization, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching analytics summary from Analytics Service");
        
        try {
            Map<String, Object> response = analyticsClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/analytics/summary")
                            .queryParamIfPresent("start_date", java.util.Optional.ofNullable(startDate))
                            .queryParamIfPresent("end_date", java.util.Optional.ofNullable(endDate))
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return mapToAnalyticsData(response);
        } catch (Exception e) {
            log.error("Failed to fetch analytics summary: {}", e.getMessage());
            return getDefaultAnalyticsData();
        }
    }

    /**
     * Fetch cost breakdown from Analytics Service
     */
    public AnalyticsData fetchCostAnalysis(String authorization, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching cost analysis from Analytics Service");
        
        try {
            Map<String, Object> response = analyticsClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/analytics/costs")
                            .queryParamIfPresent("start_date", java.util.Optional.ofNullable(startDate))
                            .queryParamIfPresent("end_date", java.util.Optional.ofNullable(endDate))
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return mapToAnalyticsData(response);
        } catch (Exception e) {
            log.error("Failed to fetch cost analysis: {}", e.getMessage());
            return getDefaultAnalyticsData();
        }
    }

    /**
     * Fetch vehicles from Vehicle Service
     */
    public VehicleData fetchVehicles(String authorization) {
        log.info("Fetching vehicles from Vehicle Service");
        
        try {
            List<Map<String, Object>> response = vehicleClient.get()
                    .uri("/vehicles")
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();

            return mapToVehicleData(response);
        } catch (Exception e) {
            log.error("Failed to fetch vehicles: {}", e.getMessage());
            return VehicleData.builder()
                    .vehicles(Collections.emptyList())
                    .totalCount(0)
                    .build();
        }
    }

    /**
     * Fetch trips from Analytics Service
     */
    public TripData fetchTrips(String authorization, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching trips from Analytics Service");
        
        try {
            List<Map<String, Object>> response = analyticsClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/analytics/trips")
                            .queryParamIfPresent("start_date", java.util.Optional.ofNullable(startDate))
                            .queryParamIfPresent("end_date", java.util.Optional.ofNullable(endDate))
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();

            return mapToTripData(response);
        } catch (Exception e) {
            log.error("Failed to fetch trips: {}", e.getMessage());
            return TripData.builder()
                    .trips(Collections.emptyList())
                    .totalCount(0)
                    .build();
        }
    }

    private AnalyticsData mapToAnalyticsData(Map<String, Object> response) {
        if (response == null) return getDefaultAnalyticsData();
        
        return AnalyticsData.builder()
                .totalVehicles(getIntValue(response, "total_vehicles", 0))
                .activeVehicles(getIntValue(response, "active_vehicles", 0))
                .totalDistanceKm(getBigDecimalValue(response, "total_distance_km"))
                .totalFuelCost(getBigDecimalValue(response, "total_fuel_cost"))
                .totalMaintenanceCost(getBigDecimalValue(response, "total_maintenance_cost"))
                .totalTollCost(getBigDecimalValue(response, "total_toll_cost"))
                .averageFuelEfficiency(getBigDecimalValue(response, "average_fuel_efficiency"))
                .build();
    }

    private VehicleData mapToVehicleData(List<Map<String, Object>> response) {
        if (response == null) return VehicleData.builder().vehicles(Collections.emptyList()).totalCount(0).build();
        
        List<VehicleData.Vehicle> vehicles = response.stream()
                .map(v -> VehicleData.Vehicle.builder()
                        .id(getStringValue(v, "id"))
                        .vin(getStringValue(v, "vin"))
                        .make(getStringValue(v, "make"))
                        .model(getStringValue(v, "model"))
                        .year(getIntValue(v, "year", 0))
                        .fuelType(getStringValue(v, "fuel_type"))
                        .mileage(getIntValue(v, "mileage", 0))
                        .status(getStringValue(v, "status"))
                        .licensePlate(getStringValue(v, "license_plate"))
                        .build())
                .toList();

        return VehicleData.builder()
                .vehicles(vehicles)
                .totalCount(vehicles.size())
                .build();
    }

    private TripData mapToTripData(List<Map<String, Object>> response) {
        if (response == null) return TripData.builder().trips(Collections.emptyList()).totalCount(0).build();
        
        List<TripData.Trip> trips = response.stream()
                .map(t -> TripData.Trip.builder()
                        .id(getStringValue(t, "id"))
                        .vehicleId(getStringValue(t, "vehicle_id"))
                        .vehicleLabel(getStringValue(t, "vehicle_label"))
                        .distanceKm(getBigDecimalValue(t, "distance_km"))
                        .fuelCost(getBigDecimalValue(t, "fuel_cost"))
                        .notes(getStringValue(t, "notes"))
                        .build())
                .toList();

        return TripData.builder()
                .trips(trips)
                .totalCount(trips.size())
                .build();
    }

    private AnalyticsData getDefaultAnalyticsData() {
        return AnalyticsData.builder()
                .totalVehicles(0)
                .activeVehicles(0)
                .totalDistanceKm(java.math.BigDecimal.ZERO)
                .totalFuelCost(java.math.BigDecimal.ZERO)
                .totalMaintenanceCost(java.math.BigDecimal.ZERO)
                .build();
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Integer getIntValue(Map<String, Object> map, String key, int defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }

    private java.math.BigDecimal getBigDecimalValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return new java.math.BigDecimal(value.toString());
        }
        return java.math.BigDecimal.ZERO;
    }
}
