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
public class VehicleData {

    private List<Vehicle> vehicles;

    @JsonProperty("total_count")
    private Integer totalCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Vehicle {
        private String id;
        private String vin;
        private String make;
        private String model;
        private Integer year;
        
        @JsonProperty("fuel_type")
        private String fuelType;
        
        private Integer mileage;
        private String status;
        
        @JsonProperty("license_plate")
        private String licensePlate;
        
        @JsonProperty("last_service_date")
        private LocalDateTime lastServiceDate;
        
        @JsonProperty("next_service_date")
        private LocalDateTime nextServiceDate;
        
        @JsonProperty("insurance_expiry")
        private LocalDateTime insuranceExpiry;
        
        @JsonProperty("owner_id")
        private String ownerId;
        
        @JsonProperty("owner_name")
        private String ownerName;
    }
}
