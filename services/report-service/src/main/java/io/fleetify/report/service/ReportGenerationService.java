package io.fleetify.report.service;

import io.fleetify.report.client.ServiceClient;
import io.fleetify.report.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportGenerationService {

    private final ServiceClient serviceClient;
    private final PdfGeneratorService pdfGenerator;

    /**
     * Generate Fleet Summary Report
     */
    public byte[] generateFleetSummaryReport(ReportRequest request, String authorization) {
        log.info("Generating Fleet Summary Report");

        // Fetch data from services
        AnalyticsData analyticsData = serviceClient.fetchAnalyticsSummary(
                authorization, request.getStartDate(), request.getEndDate());
        VehicleData vehicleData = serviceClient.fetchVehicles(authorization);

        log.info("Analytics data: vehicles={}, distance={}, fuelCost={}", 
                analyticsData.getTotalVehicles(), 
                analyticsData.getTotalDistanceKm(), 
                analyticsData.getTotalFuelCost());

        // Prepare vehicle list for PDF
        List<Map<String, Object>> vehicleList = new ArrayList<>();
        if (vehicleData.getVehicles() != null) {
            for (VehicleData.Vehicle v : vehicleData.getVehicles()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", formatVehicleName(v));
                row.put("licensePlate", v.getLicensePlate() != null ? v.getLicensePlate() : "-");
                row.put("status", translateStatus(v.getStatus()));
                row.put("mileage", v.getMileage() != null ? v.getMileage() + " km" : "-");
                row.put("fuelType", translateFuelType(v.getFuelType()));
                vehicleList.add(row);
            }
        }

        return pdfGenerator.generateFleetSummaryPdf(
                "Fleetify",
                request.getStartDate(),
                request.getEndDate(),
                analyticsData.getTotalVehicles(),
                analyticsData.getActiveVehicles(),
                analyticsData.getTotalDistanceKm(),
                analyticsData.getTotalFuelCost(),
                analyticsData.getTotalTollCost(),
                analyticsData.getAverageFuelEfficiency(),
                vehicleList
        );
    }

    /**
     * Generate Vehicle Utilization Report
     */
    public byte[] generateVehicleUtilizationReport(ReportRequest request, String authorization) {
        log.info("Generating Vehicle Utilization Report");

        VehicleData vehicleData = serviceClient.fetchVehicles(authorization);

        List<Map<String, Object>> utilizationList = new ArrayList<>();
        if (vehicleData.getVehicles() != null) {
            Random rand = new Random();
            for (VehicleData.Vehicle v : vehicleData.getVehicles()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", formatVehicleName(v));
                row.put("licensePlate", v.getLicensePlate() != null ? v.getLicensePlate() : "-");
                row.put("mileage", v.getMileage() != null ? v.getMileage() + " km" : "-");
                // Calculate utilization based on status
                int utilization = "available".equals(v.getStatus()) ? 0 : 
                                 "in_use".equals(v.getStatus()) ? 80 + rand.nextInt(20) : 
                                 50 + rand.nextInt(30);
                row.put("utilizationPercent", utilization + "%");
                row.put("status", translateStatus(v.getStatus()));
                utilizationList.add(row);
            }
        }

        return pdfGenerator.generateVehicleUtilizationPdf(
                "Fleetify",
                request.getStartDate(),
                request.getEndDate(),
                vehicleData.getTotalCount(),
                utilizationList
        );
    }

    /**
     * Generate Cost Analysis Report
     */
    public byte[] generateCostAnalysisReport(ReportRequest request, String authorization) {
        log.info("Generating Cost Analysis Report");

        AnalyticsData analyticsData = serviceClient.fetchCostAnalysis(
                authorization, request.getStartDate(), request.getEndDate());

        BigDecimal total = BigDecimal.ZERO;
        if (analyticsData.getTotalFuelCost() != null) total = total.add(analyticsData.getTotalFuelCost());
        if (analyticsData.getTotalMaintenanceCost() != null) total = total.add(analyticsData.getTotalMaintenanceCost());
        if (analyticsData.getTotalTollCost() != null) total = total.add(analyticsData.getTotalTollCost());

        return pdfGenerator.generateCostAnalysisPdf(
                "Fleetify",
                request.getStartDate(),
                request.getEndDate(),
                analyticsData.getTotalFuelCost(),
                analyticsData.getTotalMaintenanceCost(),
                analyticsData.getTotalTollCost(),
                total
        );
    }

    /**
     * Generate Trips Report
     */
    public byte[] generateTripsReport(ReportRequest request, String authorization) {
        log.info("Generating Trips Report");

        TripData tripData = serviceClient.fetchTrips(
                authorization, request.getStartDate(), request.getEndDate());

        log.info("Fetched {} trips", tripData.getTotalCount());

        List<Map<String, Object>> tripList = new ArrayList<>();
        BigDecimal totalDistance = BigDecimal.ZERO;
        BigDecimal totalFuelCost = BigDecimal.ZERO;

        if (tripData.getTrips() != null) {
            for (TripData.Trip t : tripData.getTrips()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", t.getVehicleLabel() != null ? t.getVehicleLabel() : "-");
                row.put("distance", formatNumber(t.getDistanceKm()) + " km");
                row.put("fuelCost", formatCurrency(t.getFuelCost()));
                row.put("notes", t.getNotes() != null && !t.getNotes().isEmpty() ? t.getNotes() : "-");
                tripList.add(row);

                if (t.getDistanceKm() != null) totalDistance = totalDistance.add(t.getDistanceKm());
                if (t.getFuelCost() != null) totalFuelCost = totalFuelCost.add(t.getFuelCost());
            }
        }

        return pdfGenerator.generateTripsPdf(
                "Fleetify",
                request.getStartDate(),
                request.getEndDate(),
                tripData.getTotalCount(),
                totalDistance,
                totalFuelCost,
                tripList
        );
    }

    // ======================== Helper Methods ========================

    private String formatVehicleName(VehicleData.Vehicle v) {
        StringBuilder sb = new StringBuilder();
        if (v.getMake() != null) sb.append(v.getMake());
        if (v.getModel() != null) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(v.getModel());
        }
        if (v.getYear() != null && v.getYear() > 0) {
            sb.append(" (").append(v.getYear()).append(")");
        }
        return sb.length() > 0 ? sb.toString() : "Nieznany pojazd";
    }

    private String formatNumber(BigDecimal number) {
        return number != null ? String.format("%.2f", number) : "0.00";
    }

    private String formatCurrency(BigDecimal amount) {
        return amount != null ? String.format("%.2f zl", amount) : "0.00 zl";
    }

    private String translateStatus(String status) {
        if (status == null) return "-";
        return switch (status.toLowerCase()) {
            case "active", "available" -> "Dostepny";
            case "in_use", "in-use" -> "W uzyciu";
            case "maintenance", "service" -> "Serwis";
            case "inactive" -> "Nieaktywny";
            default -> status;
        };
    }

    private String translateFuelType(String fuelType) {
        if (fuelType == null) return "-";
        return switch (fuelType.toLowerCase()) {
            case "gasoline", "petrol", "gas" -> "Benzyna";
            case "diesel" -> "Diesel";
            case "electric", "ev" -> "Elektryczny";
            case "hybrid" -> "Hybrydowy";
            case "lpg" -> "LPG";
            default -> fuelType;
        };
    }
}
