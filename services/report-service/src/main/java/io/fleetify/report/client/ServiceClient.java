package io.fleetify.report.client;

import io.fleetify.report.dto.AnalyticsData;
import io.fleetify.report.dto.TripData;
import io.fleetify.report.dto.VehicleData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
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
     * Fetch analytics summary - aggregates from trips and fuel logs
     */
    public AnalyticsData fetchAnalyticsSummary(String authorization, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching analytics summary (aggregating trips and fuel logs)");
        
        try {
            // Fetch trips
            List<Map<String, Object>> trips = fetchTripsRaw(authorization);
            // Fetch fuel logs
            List<Map<String, Object>> fuelLogs = fetchFuelLogsRaw(authorization);
            // Fetch vehicles
            VehicleData vehicleData = fetchVehicles(authorization);
            
            // Aggregate data
            BigDecimal totalDistance = BigDecimal.ZERO;
            BigDecimal totalFuelCost = BigDecimal.ZERO;
            BigDecimal totalTollCost = BigDecimal.ZERO;
            BigDecimal totalLiters = BigDecimal.ZERO;
            
            for (Map<String, Object> trip : trips) {
                BigDecimal distance = getBigDecimalValue(trip, "distance_km");
                BigDecimal tolls = getBigDecimalValue(trip, "tolls_cost");
                totalDistance = totalDistance.add(distance);
                totalTollCost = totalTollCost.add(tolls);
            }
            
            for (Map<String, Object> fuelLog : fuelLogs) {
                BigDecimal cost = getBigDecimalValue(fuelLog, "total_cost");
                BigDecimal liters = getBigDecimalValue(fuelLog, "liters");
                totalFuelCost = totalFuelCost.add(cost);
                totalLiters = totalLiters.add(liters);
            }
            
            // Calculate average fuel efficiency (L/100km)
            BigDecimal avgFuelEfficiency = BigDecimal.ZERO;
            if (totalDistance.compareTo(BigDecimal.ZERO) > 0 && totalLiters.compareTo(BigDecimal.ZERO) > 0) {
                avgFuelEfficiency = totalLiters.multiply(new BigDecimal("100"))
                        .divide(totalDistance, 2, java.math.RoundingMode.HALF_UP);
            }
            
            int totalVehicles = vehicleData.getTotalCount();
            int activeVehicles = (int) vehicleData.getVehicles().stream()
                    .filter(v -> "available".equals(v.getStatus()) || "in_use".equals(v.getStatus()))
                    .count();
            
            log.info("Aggregated: {} trips, {} fuel logs, total distance: {}, fuel cost: {}", 
                    trips.size(), fuelLogs.size(), totalDistance, totalFuelCost);
            
            return AnalyticsData.builder()
                    .totalVehicles(totalVehicles)
                    .activeVehicles(activeVehicles)
                    .totalDistanceKm(totalDistance)
                    .totalFuelCost(totalFuelCost)
                    .totalMaintenanceCost(BigDecimal.ZERO) // Could add maintenance logs later
                    .totalTollCost(totalTollCost)
                    .averageFuelEfficiency(avgFuelEfficiency)
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to fetch analytics summary: {}", e.getMessage(), e);
            return getDefaultAnalyticsData();
        }
    }

    /**
     * Fetch cost breakdown from aggregated data
     */
    public AnalyticsData fetchCostAnalysis(String authorization, LocalDate startDate, LocalDate endDate) {
        // Use same aggregation
        return fetchAnalyticsSummary(authorization, startDate, endDate);
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

            log.info("Fetched {} vehicles", response != null ? response.size() : 0);
            return mapToVehicleData(response);
        } catch (Exception e) {
            log.error("Failed to fetch vehicles: {}", e.getMessage(), e);
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
            List<Map<String, Object>> response = fetchTripsRaw(authorization);
            return mapToTripData(response);
        } catch (Exception e) {
            log.error("Failed to fetch trips: {}", e.getMessage(), e);
            return TripData.builder()
                    .trips(Collections.emptyList())
                    .totalCount(0)
                    .build();
        }
    }

    private List<Map<String, Object>> fetchTripsRaw(String authorization) {
        try {
            List<Map<String, Object>> response = analyticsClient.get()
                    .uri("/analytics/trips")
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            log.info("Fetched {} trips", response != null ? response.size() : 0);
            return response != null ? response : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch trips: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<Map<String, Object>> fetchFuelLogsRaw(String authorization) {
        try {
            List<Map<String, Object>> response = analyticsClient.get()
                    .uri("/analytics/fuel-logs")
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            log.info("Fetched {} fuel logs", response != null ? response.size() : 0);
            return response != null ? response : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch fuel logs: {}", e.getMessage());
            return Collections.emptyList();
        }
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
        
        BigDecimal totalDistance = BigDecimal.ZERO;
        BigDecimal totalFuelCost = BigDecimal.ZERO;
        
        List<TripData.Trip> trips = response.stream()
                .map(t -> TripData.Trip.builder()
                        .id(getStringValue(t, "id"))
                        .vehicleId(getStringValue(t, "vehicle_id"))
                        .vehicleLabel(getStringValue(t, "vehicle_label"))
                        .distanceKm(getBigDecimalValue(t, "distance_km"))
                        .fuelCost(getBigDecimalValue(t, "fuel_cost"))
                        .tollsCost(getBigDecimalValue(t, "tolls_cost"))
                        .notes(getStringValue(t, "notes"))
                        .startLocation(getStringValue(t, "start_location"))
                        .endLocation(getStringValue(t, "end_location"))
                        .build())
                .toList();
        
        for (TripData.Trip trip : trips) {
            if (trip.getDistanceKm() != null) totalDistance = totalDistance.add(trip.getDistanceKm());
            if (trip.getFuelCost() != null) totalFuelCost = totalFuelCost.add(trip.getFuelCost());
        }

        return TripData.builder()
                .trips(trips)
                .totalCount(trips.size())
                .totalDistance(totalDistance)
                .totalFuelCost(totalFuelCost)
                .build();
    }

    private AnalyticsData getDefaultAnalyticsData() {
        return AnalyticsData.builder()
                .totalVehicles(0)
                .activeVehicles(0)
                .totalDistanceKm(BigDecimal.ZERO)
                .totalFuelCost(BigDecimal.ZERO)
                .totalMaintenanceCost(BigDecimal.ZERO)
                .totalTollCost(BigDecimal.ZERO)
                .averageFuelEfficiency(BigDecimal.ZERO)
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

    private BigDecimal getBigDecimalValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return new BigDecimal(value.toString());
        }
        return BigDecimal.ZERO;
    }
}
