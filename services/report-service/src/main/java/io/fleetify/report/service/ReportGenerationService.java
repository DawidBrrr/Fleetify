package io.fleetify.report.service;

import io.fleetify.report.client.ServiceClient;
import io.fleetify.report.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportGenerationService {

    private final ServiceClient serviceClient;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    /**
     * Generate Fleet Summary Report
     */
    public byte[] generateFleetSummaryReport(ReportRequest request, String authorization) {
        log.info("Generating Fleet Summary Report");

        // Fetch data from services
        AnalyticsData analyticsData = serviceClient.fetchAnalyticsSummary(
                authorization, request.getStartDate(), request.getEndDate());
        VehicleData vehicleData = serviceClient.fetchVehicles(authorization);

        // Prepare report parameters
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Raport podsumowania floty");
        parameters.put("companyName", "Fleetify");
        parameters.put("reportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        parameters.put("periodStart", formatDate(request.getStartDate()));
        parameters.put("periodEnd", formatDate(request.getEndDate()));
        
        // Fleet stats
        parameters.put("totalVehicles", analyticsData.getTotalVehicles());
        parameters.put("activeVehicles", analyticsData.getActiveVehicles());
        parameters.put("totalDistanceKm", formatNumber(analyticsData.getTotalDistanceKm()));
        parameters.put("totalFuelCost", formatCurrency(analyticsData.getTotalFuelCost()));
        parameters.put("totalMaintenanceCost", formatCurrency(analyticsData.getTotalMaintenanceCost()));
        parameters.put("totalTollCost", formatCurrency(analyticsData.getTotalTollCost()));
        parameters.put("averageFuelEfficiency", formatNumber(analyticsData.getAverageFuelEfficiency()));

        // Calculate total costs
        BigDecimal totalCosts = BigDecimal.ZERO;
        if (analyticsData.getTotalFuelCost() != null) totalCosts = totalCosts.add(analyticsData.getTotalFuelCost());
        if (analyticsData.getTotalMaintenanceCost() != null) totalCosts = totalCosts.add(analyticsData.getTotalMaintenanceCost());
        if (analyticsData.getTotalTollCost() != null) totalCosts = totalCosts.add(analyticsData.getTotalTollCost());
        parameters.put("totalCosts", formatCurrency(totalCosts));

        // Vehicle list as datasource
        List<Map<String, Object>> vehicleList = new ArrayList<>();
        if (vehicleData.getVehicles() != null) {
            for (VehicleData.Vehicle v : vehicleData.getVehicles()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", v.getMake() + " " + v.getModel() + " (" + v.getYear() + ")");
                row.put("licensePlate", v.getLicensePlate() != null ? v.getLicensePlate() : "-");
                row.put("status", translateStatus(v.getStatus()));
                row.put("mileage", v.getMileage() != null ? v.getMileage().toString() + " km" : "-");
                row.put("fuelType", translateFuelType(v.getFuelType()));
                vehicleList.add(row);
            }
        }

        return generatePdfFromTemplate("fleet_summary", parameters, vehicleList);
    }

    /**
     * Generate Vehicle Utilization Report
     */
    public byte[] generateVehicleUtilizationReport(ReportRequest request, String authorization) {
        log.info("Generating Vehicle Utilization Report");

        VehicleData vehicleData = serviceClient.fetchVehicles(authorization);
        AnalyticsData analyticsData = serviceClient.fetchAnalyticsSummary(
                authorization, request.getStartDate(), request.getEndDate());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Raport wykorzystania pojazdów");
        parameters.put("companyName", "Fleetify");
        parameters.put("reportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        parameters.put("periodStart", formatDate(request.getStartDate()));
        parameters.put("periodEnd", formatDate(request.getEndDate()));
        parameters.put("totalVehicles", vehicleData.getTotalCount());

        List<Map<String, Object>> utilizationList = new ArrayList<>();
        if (vehicleData.getVehicles() != null) {
            Random rand = new Random(); // Mock utilization for demo
            for (VehicleData.Vehicle v : vehicleData.getVehicles()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", v.getMake() + " " + v.getModel());
                row.put("licensePlate", v.getLicensePlate() != null ? v.getLicensePlate() : "-");
                row.put("mileage", v.getMileage() != null ? v.getMileage() : 0);
                row.put("utilizationPercent", 50 + rand.nextInt(50)); // Mock: 50-100%
                row.put("status", translateStatus(v.getStatus()));
                utilizationList.add(row);
            }
        }

        return generatePdfFromTemplate("vehicle_utilization", parameters, utilizationList);
    }

    /**
     * Generate Cost Analysis Report
     */
    public byte[] generateCostAnalysisReport(ReportRequest request, String authorization) {
        log.info("Generating Cost Analysis Report");

        AnalyticsData analyticsData = serviceClient.fetchCostAnalysis(
                authorization, request.getStartDate(), request.getEndDate());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Raport analizy kosztów");
        parameters.put("companyName", "Fleetify");
        parameters.put("reportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        parameters.put("periodStart", formatDate(request.getStartDate()));
        parameters.put("periodEnd", formatDate(request.getEndDate()));
        
        parameters.put("fuelCost", formatCurrency(analyticsData.getTotalFuelCost()));
        parameters.put("maintenanceCost", formatCurrency(analyticsData.getTotalMaintenanceCost()));
        parameters.put("tollCost", formatCurrency(analyticsData.getTotalTollCost()));
        
        BigDecimal total = BigDecimal.ZERO;
        if (analyticsData.getTotalFuelCost() != null) total = total.add(analyticsData.getTotalFuelCost());
        if (analyticsData.getTotalMaintenanceCost() != null) total = total.add(analyticsData.getTotalMaintenanceCost());
        if (analyticsData.getTotalTollCost() != null) total = total.add(analyticsData.getTotalTollCost());
        parameters.put("totalCost", formatCurrency(total));

        // Cost breakdown list
        List<Map<String, Object>> costList = new ArrayList<>();
        costList.add(createCostRow("Paliwo", analyticsData.getTotalFuelCost(), total));
        costList.add(createCostRow("Serwis i naprawy", analyticsData.getTotalMaintenanceCost(), total));
        costList.add(createCostRow("Opłaty drogowe", analyticsData.getTotalTollCost(), total));

        return generatePdfFromTemplate("cost_analysis", parameters, costList);
    }

    /**
     * Generate Trips Report
     */
    public byte[] generateTripsReport(ReportRequest request, String authorization) {
        log.info("Generating Trips Report");

        TripData tripData = serviceClient.fetchTrips(
                authorization, request.getStartDate(), request.getEndDate());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Raport przejazdów");
        parameters.put("companyName", "Fleetify");
        parameters.put("reportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        parameters.put("periodStart", formatDate(request.getStartDate()));
        parameters.put("periodEnd", formatDate(request.getEndDate()));
        parameters.put("totalTrips", tripData.getTotalCount());
        parameters.put("totalDistance", formatNumber(tripData.getTotalDistance()));
        parameters.put("totalFuelCost", formatCurrency(tripData.getTotalFuelCost()));

        List<Map<String, Object>> tripList = new ArrayList<>();
        if (tripData.getTrips() != null) {
            for (TripData.Trip t : tripData.getTrips()) {
                Map<String, Object> row = new HashMap<>();
                row.put("vehicle", t.getVehicleLabel() != null ? t.getVehicleLabel() : "-");
                row.put("distance", formatNumber(t.getDistanceKm()) + " km");
                row.put("fuelCost", formatCurrency(t.getFuelCost()));
                row.put("notes", t.getNotes() != null ? t.getNotes() : "-");
                tripList.add(row);
            }
        }

        return generatePdfFromTemplate("trips", parameters, tripList);
    }

    /**
     * Generate PDF from template or use programmatic generation
     */
    private byte[] generatePdfFromTemplate(String templateName, Map<String, Object> parameters, List<Map<String, Object>> dataList) {
        try {
            // Try to load Jasper template
            String templatePath = "reports/" + templateName + ".jrxml";
            InputStream templateStream = getClass().getClassLoader().getResourceAsStream(templatePath);
            
            if (templateStream != null) {
                JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
                JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dataList);
                JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
                
                return exportToPdf(jasperPrint);
            } else {
                // Fallback: Generate simple PDF programmatically
                log.warn("Template {} not found, using programmatic generation", templateName);
                return generateSimplePdf(parameters, dataList);
            }
        } catch (Exception e) {
            log.error("Error generating PDF report: {}", e.getMessage(), e);
            return generateSimplePdf(parameters, dataList);
        }
    }

    private byte[] exportToPdf(JasperPrint jasperPrint) throws JRException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        JRPdfExporter exporter = new JRPdfExporter();
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
        
        SimplePdfExporterConfiguration config = new SimplePdfExporterConfiguration();
        config.setMetadataAuthor("Fleetify");
        exporter.setConfiguration(config);
        
        exporter.exportReport();
        
        return outputStream.toByteArray();
    }

    /**
     * Generate simple PDF without Jasper template (fallback)
     */
    private byte[] generateSimplePdf(Map<String, Object> parameters, List<Map<String, Object>> dataList) {
        try {
            // Use JasperReports programmatic approach
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            // Create a simple text-based PDF using JasperReports
            JasperPrint print = new JasperPrint();
            print.setName((String) parameters.getOrDefault("reportTitle", "Report"));
            print.setPageWidth(595);
            print.setPageHeight(842);
            
            // Since we don't have a template, let's create raw PDF content
            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<html><head><meta charset='UTF-8'/>");
            htmlContent.append("<style>");
            htmlContent.append("body { font-family: Arial, sans-serif; padding: 40px; }");
            htmlContent.append("h1 { color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 10px; }");
            htmlContent.append("h2 { color: #333; margin-top: 30px; }");
            htmlContent.append(".info { margin: 20px 0; }");
            htmlContent.append(".info p { margin: 5px 0; }");
            htmlContent.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
            htmlContent.append("th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }");
            htmlContent.append("th { background-color: #0d6efd; color: white; }");
            htmlContent.append("tr:nth-child(even) { background-color: #f2f2f2; }");
            htmlContent.append(".summary { background: #e7f1ff; padding: 20px; border-radius: 8px; margin: 20px 0; }");
            htmlContent.append(".footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }");
            htmlContent.append("</style></head><body>");
            
            // Header
            htmlContent.append("<h1>").append(parameters.getOrDefault("reportTitle", "Raport")).append("</h1>");
            
            // Company info
            htmlContent.append("<div class='info'>");
            htmlContent.append("<p><strong>Firma:</strong> ").append(parameters.getOrDefault("companyName", "Fleetify")).append("</p>");
            htmlContent.append("<p><strong>Data wygenerowania:</strong> ").append(parameters.getOrDefault("reportDate", "-")).append("</p>");
            htmlContent.append("<p><strong>Okres:</strong> ").append(parameters.getOrDefault("periodStart", "-"))
                    .append(" - ").append(parameters.getOrDefault("periodEnd", "-")).append("</p>");
            htmlContent.append("</div>");
            
            // Summary section
            htmlContent.append("<div class='summary'>");
            htmlContent.append("<h2>Podsumowanie</h2>");
            for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                if (!entry.getKey().equals("reportTitle") && !entry.getKey().equals("companyName") 
                        && !entry.getKey().equals("reportDate") && !entry.getKey().equals("periodStart") 
                        && !entry.getKey().equals("periodEnd")) {
                    htmlContent.append("<p><strong>").append(translateParamName(entry.getKey()))
                            .append(":</strong> ").append(entry.getValue()).append("</p>");
                }
            }
            htmlContent.append("</div>");
            
            // Data table
            if (!dataList.isEmpty()) {
                htmlContent.append("<h2>Szczegóły</h2>");
                htmlContent.append("<table>");
                
                // Header row
                htmlContent.append("<tr>");
                for (String key : dataList.get(0).keySet()) {
                    htmlContent.append("<th>").append(translateParamName(key)).append("</th>");
                }
                htmlContent.append("</tr>");
                
                // Data rows
                for (Map<String, Object> row : dataList) {
                    htmlContent.append("<tr>");
                    for (Object value : row.values()) {
                        htmlContent.append("<td>").append(value != null ? value : "-").append("</td>");
                    }
                    htmlContent.append("</tr>");
                }
                htmlContent.append("</table>");
            }
            
            // Footer
            htmlContent.append("<div class='footer'>");
            htmlContent.append("<p>Wygenerowano automatycznie przez system Fleetify</p>");
            htmlContent.append("<p>© 2026 Fleetify - System zarządzania flotą</p>");
            htmlContent.append("</div>");
            
            htmlContent.append("</body></html>");
            
            // Convert HTML to PDF using JasperReports HTML export (simplified)
            return JasperExportManager.exportReportToPdf(
                    createEmptyJasperPrint((String) parameters.getOrDefault("reportTitle", "Report"), htmlContent.toString()));
            
        } catch (Exception e) {
            log.error("Failed to generate simple PDF: {}", e.getMessage());
            // Return minimal valid PDF
            return createMinimalPdf(parameters);
        }
    }

    private JasperPrint createEmptyJasperPrint(String title, String content) throws JRException {
        // Create empty report and use HTML text element
        String jrxml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
                              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
                              http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
                              name="DynamicReport" pageWidth="595" pageHeight="842" columnWidth="515"
                              leftMargin="40" rightMargin="40" topMargin="40" bottomMargin="40">
                    <parameter name="CONTENT" class="java.lang.String"/>
                    <title>
                        <band height="762">
                            <textField>
                                <reportElement x="0" y="0" width="515" height="762"/>
                                <textElement markup="html"/>
                                <textFieldExpression><![CDATA[$P{CONTENT}]]></textFieldExpression>
                            </textField>
                        </band>
                    </title>
                </jasperReport>
                """;
        
        JasperReport report = JasperCompileManager.compileReport(
                new java.io.ByteArrayInputStream(jrxml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        
        Map<String, Object> params = new HashMap<>();
        params.put("CONTENT", content);
        
        return JasperFillManager.fillReport(report, params, new JREmptyDataSource());
    }

    private byte[] createMinimalPdf(Map<String, Object> parameters) {
        // Create a minimal PDF with basic info
        try {
            String jrxml = """
                    <?xml version="1.0" encoding="UTF-8"?>
                    <jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
                                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                                  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
                                  http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
                                  name="MinimalReport" pageWidth="595" pageHeight="842">
                        <parameter name="TITLE" class="java.lang.String"/>
                        <parameter name="DATE" class="java.lang.String"/>
                        <title>
                            <band height="100">
                                <textField>
                                    <reportElement x="0" y="20" width="595" height="40"/>
                                    <textElement textAlignment="Center">
                                        <font size="24" isBold="true"/>
                                    </textElement>
                                    <textFieldExpression><![CDATA[$P{TITLE}]]></textFieldExpression>
                                </textField>
                                <textField>
                                    <reportElement x="0" y="70" width="595" height="20"/>
                                    <textElement textAlignment="Center"/>
                                    <textFieldExpression><![CDATA["Wygenerowano: " + $P{DATE}]]></textFieldExpression>
                                </textField>
                            </band>
                        </title>
                    </jasperReport>
                    """;
            
            JasperReport report = JasperCompileManager.compileReport(
                    new java.io.ByteArrayInputStream(jrxml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            
            Map<String, Object> params = new HashMap<>();
            params.put("TITLE", parameters.getOrDefault("reportTitle", "Raport Fleetify"));
            params.put("DATE", parameters.getOrDefault("reportDate", LocalDateTime.now().toString()));
            
            JasperPrint print = JasperFillManager.fillReport(report, params, new JREmptyDataSource());
            return JasperExportManager.exportReportToPdf(print);
            
        } catch (Exception e) {
            log.error("Failed to create minimal PDF: {}", e.getMessage());
            return new byte[0];
        }
    }

    private Map<String, Object> createCostRow(String category, BigDecimal amount, BigDecimal total) {
        Map<String, Object> row = new HashMap<>();
        row.put("category", category);
        row.put("amount", formatCurrency(amount));
        if (total != null && total.compareTo(BigDecimal.ZERO) > 0 && amount != null) {
            BigDecimal percent = amount.multiply(new BigDecimal("100")).divide(total, 1, java.math.RoundingMode.HALF_UP);
            row.put("percent", percent + "%");
        } else {
            row.put("percent", "0%");
        }
        return row;
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : "-";
    }

    private String formatNumber(BigDecimal number) {
        return number != null ? String.format("%.2f", number) : "0.00";
    }

    private String formatCurrency(BigDecimal amount) {
        return amount != null ? String.format("%.2f zł", amount) : "0.00 zł";
    }

    private String translateStatus(String status) {
        if (status == null) return "-";
        return switch (status.toLowerCase()) {
            case "active", "available" -> "Dostępny";
            case "in_use", "in-use" -> "W użyciu";
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

    private String translateParamName(String name) {
        return switch (name) {
            case "totalVehicles" -> "Łączna liczba pojazdów";
            case "activeVehicles" -> "Aktywne pojazdy";
            case "totalDistanceKm" -> "Łączny dystans";
            case "totalFuelCost" -> "Koszt paliwa";
            case "totalMaintenanceCost" -> "Koszt serwisu";
            case "totalTollCost" -> "Opłaty drogowe";
            case "totalCosts" -> "Łączne koszty";
            case "averageFuelEfficiency" -> "Średnie zużycie paliwa";
            case "vehicle" -> "Pojazd";
            case "licensePlate" -> "Nr rejestracyjny";
            case "status" -> "Status";
            case "mileage" -> "Przebieg";
            case "fuelType" -> "Typ paliwa";
            case "utilizationPercent" -> "Wykorzystanie %";
            case "category" -> "Kategoria";
            case "amount" -> "Kwota";
            case "percent" -> "Udział";
            case "distance" -> "Dystans";
            case "fuelCost" -> "Koszt paliwa";
            case "notes" -> "Uwagi";
            default -> name;
        };
    }
}
