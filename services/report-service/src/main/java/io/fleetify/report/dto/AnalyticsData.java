package io.fleetify.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsData {

    @JsonProperty("total_vehicles")
    private Integer totalVehicles;

    @JsonProperty("active_vehicles")
    private Integer activeVehicles;

    @JsonProperty("total_distance_km")
    private BigDecimal totalDistanceKm;

    @JsonProperty("total_fuel_cost")
    private BigDecimal totalFuelCost;

    @JsonProperty("total_maintenance_cost")
    private BigDecimal totalMaintenanceCost;

    @JsonProperty("total_toll_cost")
    private BigDecimal totalTollCost;

    @JsonProperty("average_fuel_efficiency")
    private BigDecimal averageFuelEfficiency;

    @JsonProperty("cost_breakdown")
    private Map<String, BigDecimal> costBreakdown;

    @JsonProperty("monthly_costs")
    private List<MonthlyCost> monthlyCosts;

    @JsonProperty("vehicle_utilization")
    private List<VehicleUtilization> vehicleUtilization;

    @JsonProperty("fuel_consumption_trend")
    private List<FuelConsumption> fuelConsumptionTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyCost {
        private String month;
        private BigDecimal fuel;
        private BigDecimal maintenance;
        private BigDecimal tolls;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleUtilization {
        @JsonProperty("vehicle_id")
        private String vehicleId;
        
        @JsonProperty("vehicle_name")
        private String vehicleName;
        
        @JsonProperty("utilization_percent")
        private BigDecimal utilizationPercent;
        
        @JsonProperty("total_km")
        private BigDecimal totalKm;
        
        @JsonProperty("total_trips")
        private Integer totalTrips;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FuelConsumption {
        private String date;
        
        @JsonProperty("liters")
        private BigDecimal liters;
        
        @JsonProperty("cost")
        private BigDecimal cost;
        
        @JsonProperty("efficiency_km_per_liter")
        private BigDecimal efficiencyKmPerLiter;
    }
}
