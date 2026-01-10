package io.fleetify.report.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class PdfGeneratorService {

    // Fleetify brand colors
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(13, 110, 253);    // Bootstrap primary blue
    private static final DeviceRgb SECONDARY_COLOR = new DeviceRgb(108, 117, 125); // Gray
    private static final DeviceRgb SUCCESS_COLOR = new DeviceRgb(25, 135, 84);     // Green
    private static final DeviceRgb LIGHT_BG = new DeviceRgb(248, 249, 250);        // Light gray
    private static final DeviceRgb TABLE_HEADER_BG = new DeviceRgb(13, 110, 253);
    private static final DeviceRgb TABLE_STRIPE_BG = new DeviceRgb(245, 247, 250);
    private static final DeviceRgb WHITE = new DeviceRgb(255, 255, 255);           // White

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public byte[] generateFleetSummaryPdf(
            String companyName,
            LocalDate startDate,
            LocalDate endDate,
            int totalVehicles,
            int activeVehicles,
            BigDecimal totalDistance,
            BigDecimal totalFuelCost,
            BigDecimal totalTollCost,
            BigDecimal avgFuelEfficiency,
            List<Map<String, Object>> vehicles) {
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(40, 40, 40, 40);
            
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            // Header
            addHeader(document, fontBold, font, "Raport Podsumowania Floty", companyName, startDate, endDate);
            
            // Summary Stats Section
            document.add(new Paragraph("Podsumowanie")
                    .setFont(fontBold)
                    .setFontSize(16)
                    .setFontColor(PRIMARY_COLOR)
                    .setMarginTop(20)
                    .setMarginBottom(10));
            
            // Stats Grid (2x3)
            Table statsTable = new Table(UnitValue.createPercentArray(3)).useAllAvailableWidth();
            statsTable.setMarginBottom(20);
            
            addStatCard(statsTable, fontBold, font, "Pojazdy lacznie", String.valueOf(totalVehicles));
            addStatCard(statsTable, fontBold, font, "Aktywne pojazdy", String.valueOf(activeVehicles));
            addStatCard(statsTable, fontBold, font, "Laczny dystans", formatNumber(totalDistance) + " km");
            addStatCard(statsTable, fontBold, font, "Koszt paliwa", formatCurrency(totalFuelCost));
            addStatCard(statsTable, fontBold, font, "Oplaty drogowe", formatCurrency(totalTollCost));
            addStatCard(statsTable, fontBold, font, "Srednie zuzycie", formatNumber(avgFuelEfficiency) + " L/100km");
            
            document.add(statsTable);
            
            // Total Costs Box
            BigDecimal totalCosts = BigDecimal.ZERO;
            if (totalFuelCost != null) totalCosts = totalCosts.add(totalFuelCost);
            if (totalTollCost != null) totalCosts = totalCosts.add(totalTollCost);
            
            Table costBox = new Table(1).useAllAvailableWidth();
            Cell costCell = new Cell()
                    .add(new Paragraph("LACZNE KOSZTY: " + formatCurrency(totalCosts))
                            .setFont(fontBold)
                            .setFontSize(18)
                            .setFontColor(ColorConstants.WHITE)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(SUCCESS_COLOR)
                    .setPadding(15)
                    .setBorder(Border.NO_BORDER);
            costBox.addCell(costCell);
            costBox.setMarginBottom(25);
            document.add(costBox);
            
            // Vehicles Table
            if (vehicles != null && !vehicles.isEmpty()) {
                document.add(new Paragraph("Lista Pojazdow")
                        .setFont(fontBold)
                        .setFontSize(16)
                        .setFontColor(PRIMARY_COLOR)
                        .setMarginBottom(10));
                
                Table vehicleTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 2, 2}))
                        .useAllAvailableWidth();
                
                // Header row
                addTableHeader(vehicleTable, fontBold, "Pojazd", "Nr rej.", "Status", "Przebieg", "Paliwo");
                
                // Data rows
                boolean stripe = false;
                for (Map<String, Object> v : vehicles) {
                    DeviceRgb bg = stripe ? TABLE_STRIPE_BG : WHITE;
                    addTableRow(vehicleTable, font, bg,
                            getStr(v, "vehicle"),
                            getStr(v, "licensePlate"),
                            getStr(v, "status"),
                            getStr(v, "mileage"),
                            getStr(v, "fuelType"));
                    stripe = !stripe;
                }
                
                document.add(vehicleTable);
            }
            
            // Footer
            addFooter(document, font);
            
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Failed to generate PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    public byte[] generateTripsPdf(
            String companyName,
            LocalDate startDate,
            LocalDate endDate,
            int totalTrips,
            BigDecimal totalDistance,
            BigDecimal totalFuelCost,
            List<Map<String, Object>> trips) {
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(40, 40, 40, 40);
            
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            // Header
            addHeader(document, fontBold, font, "Raport Przejazdow", companyName, startDate, endDate);
            
            // Summary Stats
            document.add(new Paragraph("Podsumowanie")
                    .setFont(fontBold)
                    .setFontSize(16)
                    .setFontColor(PRIMARY_COLOR)
                    .setMarginTop(20)
                    .setMarginBottom(10));
            
            Table statsTable = new Table(UnitValue.createPercentArray(3)).useAllAvailableWidth();
            statsTable.setMarginBottom(20);
            
            addStatCard(statsTable, fontBold, font, "Liczba przejazdow", String.valueOf(totalTrips));
            addStatCard(statsTable, fontBold, font, "Laczny dystans", formatNumber(totalDistance) + " km");
            addStatCard(statsTable, fontBold, font, "Koszt paliwa", formatCurrency(totalFuelCost));
            
            document.add(statsTable);
            
            // Trips Table
            if (trips != null && !trips.isEmpty()) {
                document.add(new Paragraph("Lista Przejazdow")
                        .setFont(fontBold)
                        .setFontSize(16)
                        .setFontColor(PRIMARY_COLOR)
                        .setMarginBottom(10));
                
                Table tripTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 3}))
                        .useAllAvailableWidth();
                
                addTableHeader(tripTable, fontBold, "Pojazd", "Dystans", "Koszt paliwa", "Uwagi");
                
                boolean stripe = false;
                for (Map<String, Object> t : trips) {
                    DeviceRgb bg = stripe ? TABLE_STRIPE_BG : WHITE;
                    addTableRow(tripTable, font, bg,
                            getStr(t, "vehicle"),
                            getStr(t, "distance"),
                            getStr(t, "fuelCost"),
                            getStr(t, "notes"));
                    stripe = !stripe;
                }
                
                document.add(tripTable);
            }
            
            addFooter(document, font);
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Failed to generate trips PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    public byte[] generateCostAnalysisPdf(
            String companyName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal fuelCost,
            BigDecimal maintenanceCost,
            BigDecimal tollCost,
            BigDecimal totalCost) {
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(40, 40, 40, 40);
            
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            // Header
            addHeader(document, fontBold, font, "Analiza Kosztow", companyName, startDate, endDate);
            
            // Cost breakdown table
            document.add(new Paragraph("Struktura Kosztow")
                    .setFont(fontBold)
                    .setFontSize(16)
                    .setFontColor(PRIMARY_COLOR)
                    .setMarginTop(20)
                    .setMarginBottom(15));
            
            Table costTable = new Table(UnitValue.createPercentArray(new float[]{4, 2, 2}))
                    .useAllAvailableWidth();
            
            addTableHeader(costTable, fontBold, "Kategoria", "Kwota", "Udzial");
            
            BigDecimal total = totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0 
                    ? totalCost : BigDecimal.ONE;
            
            addCostRow(costTable, font, "Paliwo", fuelCost, total, false);
            addCostRow(costTable, font, "Serwis i naprawy", maintenanceCost, total, true);
            addCostRow(costTable, font, "Oplaty drogowe", tollCost, total, false);
            
            // Total row
            Cell totalLabelCell = new Cell()
                    .add(new Paragraph("RAZEM").setFont(fontBold).setFontSize(12))
                    .setBackgroundColor(PRIMARY_COLOR)
                    .setFontColor(ColorConstants.WHITE)
                    .setPadding(10)
                    .setBorder(Border.NO_BORDER);
            Cell totalAmountCell = new Cell()
                    .add(new Paragraph(formatCurrency(totalCost)).setFont(fontBold).setFontSize(12))
                    .setBackgroundColor(PRIMARY_COLOR)
                    .setFontColor(ColorConstants.WHITE)
                    .setPadding(10)
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT);
            Cell totalPercentCell = new Cell()
                    .add(new Paragraph("100%").setFont(fontBold).setFontSize(12))
                    .setBackgroundColor(PRIMARY_COLOR)
                    .setFontColor(ColorConstants.WHITE)
                    .setPadding(10)
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT);
            
            costTable.addCell(totalLabelCell);
            costTable.addCell(totalAmountCell);
            costTable.addCell(totalPercentCell);
            
            document.add(costTable);
            
            addFooter(document, font);
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Failed to generate cost analysis PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    public byte[] generateVehicleUtilizationPdf(
            String companyName,
            LocalDate startDate,
            LocalDate endDate,
            int totalVehicles,
            List<Map<String, Object>> utilization) {
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(40, 40, 40, 40);
            
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            // Header
            addHeader(document, fontBold, font, "Wykorzystanie Pojazdow", companyName, startDate, endDate);
            
            // Summary
            document.add(new Paragraph("Podsumowanie")
                    .setFont(fontBold)
                    .setFontSize(16)
                    .setFontColor(PRIMARY_COLOR)
                    .setMarginTop(20)
                    .setMarginBottom(10));
            
            Table statsTable = new Table(UnitValue.createPercentArray(1)).useAllAvailableWidth();
            addStatCard(statsTable, fontBold, font, "Liczba pojazdow", String.valueOf(totalVehicles));
            document.add(statsTable);
            
            // Utilization Table
            if (utilization != null && !utilization.isEmpty()) {
                document.add(new Paragraph("Wykorzystanie wg Pojazdu")
                        .setFont(fontBold)
                        .setFontSize(16)
                        .setFontColor(PRIMARY_COLOR)
                        .setMarginTop(20)
                        .setMarginBottom(10));
                
                Table utilizationTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 2, 2}))
                        .useAllAvailableWidth();
                
                addTableHeader(utilizationTable, fontBold, "Pojazd", "Nr rej.", "Przebieg", "Wykorzystanie", "Status");
                
                boolean stripe = false;
                for (Map<String, Object> u : utilization) {
                    DeviceRgb bg = stripe ? TABLE_STRIPE_BG : WHITE;
                    addTableRow(utilizationTable, font, bg,
                            getStr(u, "vehicle"),
                            getStr(u, "licensePlate"),
                            getStr(u, "mileage"),
                            getStr(u, "utilizationPercent"),
                            getStr(u, "status"));
                    stripe = !stripe;
                }
                
                document.add(utilizationTable);
            }
            
            addFooter(document, font);
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Failed to generate utilization PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    // ======================== Helper Methods ========================

    private void addHeader(Document document, PdfFont fontBold, PdfFont font, 
                          String title, String company, LocalDate start, LocalDate end) {
        // Logo / Company Name
        Paragraph companyPara = new Paragraph("FLEETIFY")
                .setFont(fontBold)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR);
        document.add(companyPara);
        
        // Report Title
        Paragraph titlePara = new Paragraph(title)
                .setFont(fontBold)
                .setFontSize(20)
                .setFontColor(ColorConstants.BLACK)
                .setMarginTop(5);
        document.add(titlePara);
        
        // Meta info
        Table metaTable = new Table(UnitValue.createPercentArray(2)).useAllAvailableWidth();
        metaTable.setMarginTop(10);
        metaTable.setMarginBottom(10);
        
        Cell leftMeta = new Cell()
                .add(new Paragraph("Firma: " + (company != null ? company : "Fleetify")).setFont(font).setFontSize(10))
                .add(new Paragraph("Data wygenerowania: " + LocalDateTime.now().format(DATETIME_FORMATTER)).setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(0);
        
        Cell rightMeta = new Cell()
                .add(new Paragraph("Okres raportu:").setFont(fontBold).setFontSize(10))
                .add(new Paragraph(formatDate(start) + " - " + formatDate(end)).setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(0)
                .setTextAlignment(TextAlignment.RIGHT);
        
        metaTable.addCell(leftMeta);
        metaTable.addCell(rightMeta);
        document.add(metaTable);
        
        // Divider line
        Table divider = new Table(1).useAllAvailableWidth();
        divider.addCell(new Cell()
                .setHeight(2)
                .setBackgroundColor(PRIMARY_COLOR)
                .setBorder(Border.NO_BORDER));
        document.add(divider);
    }

    private void addStatCard(Table table, PdfFont fontBold, PdfFont font, String label, String value) {
        Cell cell = new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(10).setFontColor(SECONDARY_COLOR))
                .add(new Paragraph(value).setFont(fontBold).setFontSize(16).setFontColor(ColorConstants.BLACK))
                .setBackgroundColor(LIGHT_BG)
                .setPadding(12)
                .setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        table.addCell(cell);
    }

    private void addTableHeader(Table table, PdfFont fontBold, String... headers) {
        for (String header : headers) {
            Cell cell = new Cell()
                    .add(new Paragraph(header).setFont(fontBold).setFontSize(10).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(TABLE_HEADER_BG)
                    .setPadding(8)
                    .setBorder(Border.NO_BORDER);
            table.addCell(cell);
        }
    }

    private void addTableRow(Table table, PdfFont font, DeviceRgb bgColor, String... values) {
        for (String value : values) {
            Cell cell = new Cell()
                    .add(new Paragraph(value != null ? value : "-").setFont(font).setFontSize(9))
                    .setBackgroundColor(bgColor)
                    .setPadding(8)
                    .setBorder(new SolidBorder(LIGHT_BG, 1));
            table.addCell(cell);
        }
    }

    private void addCostRow(Table table, PdfFont font, String category, BigDecimal amount, 
                           BigDecimal total, boolean stripe) {
        DeviceRgb bg = stripe ? TABLE_STRIPE_BG : WHITE;
        
        BigDecimal percent = BigDecimal.ZERO;
        if (amount != null && total.compareTo(BigDecimal.ZERO) > 0) {
            percent = amount.multiply(new BigDecimal("100"))
                    .divide(total, 1, java.math.RoundingMode.HALF_UP);
        }
        
        Cell catCell = new Cell()
                .add(new Paragraph(category).setFont(font).setFontSize(11))
                .setBackgroundColor(bg)
                .setPadding(10)
                .setBorder(new SolidBorder(LIGHT_BG, 1));
        Cell amtCell = new Cell()
                .add(new Paragraph(formatCurrency(amount)).setFont(font).setFontSize(11))
                .setBackgroundColor(bg)
                .setPadding(10)
                .setBorder(new SolidBorder(LIGHT_BG, 1))
                .setTextAlignment(TextAlignment.RIGHT);
        Cell pctCell = new Cell()
                .add(new Paragraph(percent + "%").setFont(font).setFontSize(11))
                .setBackgroundColor(bg)
                .setPadding(10)
                .setBorder(new SolidBorder(LIGHT_BG, 1))
                .setTextAlignment(TextAlignment.RIGHT);
        
        table.addCell(catCell);
        table.addCell(amtCell);
        table.addCell(pctCell);
    }

    private void addFooter(Document document, PdfFont font) {
        document.add(new Paragraph("\n"));
        
        Table footer = new Table(1).useAllAvailableWidth();
        footer.setMarginTop(30);
        
        Cell footerCell = new Cell()
                .add(new Paragraph("Wygenerowano automatycznie przez system Fleetify")
                        .setFont(font).setFontSize(9).setFontColor(SECONDARY_COLOR)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("© 2026 Fleetify - System Zarzadzania Flota")
                        .setFont(font).setFontSize(9).setFontColor(SECONDARY_COLOR)
                        .setTextAlignment(TextAlignment.CENTER))
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(15)
                .setBorderTop(new SolidBorder(LIGHT_BG, 1));
        
        footer.addCell(footerCell);
        document.add(footer);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : "-";
    }

    private String formatNumber(BigDecimal number) {
        return number != null ? String.format("%.2f", number) : "0.00";
    }

    private String formatCurrency(BigDecimal amount) {
        return amount != null ? String.format("%.2f zl", amount) : "0.00 zl";
    }

    private String getStr(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : "-";
    }
}
