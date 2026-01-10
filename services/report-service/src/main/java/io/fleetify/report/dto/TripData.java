package io.fleetify.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripData {

    private List<Trip> trips;

    @JsonProperty("total_count")
    private Integer totalCount;

    @JsonProperty("total_distance")
    private BigDecimal totalDistance;

    @JsonProperty("total_fuel_cost")
    private BigDecimal totalFuelCost;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Trip {
        private String id;
        
        @JsonProperty("vehicle_id")
        private String vehicleId;
        
        @JsonProperty("vehicle_label")
        private String vehicleLabel;
        
        @JsonProperty("driver_id")
        private String driverId;
        
        @JsonProperty("driver_name")
        private String driverName;
        
        @JsonProperty("start_location")
        private String startLocation;
        
        @JsonProperty("end_location")
        private String endLocation;
        
        @JsonProperty("start_time")
        private LocalDateTime startTime;
        
        @JsonProperty("end_time")
        private LocalDateTime endTime;
        
        @JsonProperty("distance_km")
        private BigDecimal distanceKm;
        
        @JsonProperty("fuel_cost")
        private BigDecimal fuelCost;
        
        @JsonProperty("toll_cost")
        private BigDecimal tollCost;
        
        private String notes;
    }
}
