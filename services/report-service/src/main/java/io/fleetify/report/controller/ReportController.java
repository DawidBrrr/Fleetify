package io.fleetify.report.controller;

import io.fleetify.report.dto.ReportJobResponse;
import io.fleetify.report.dto.ReportRequest;
import io.fleetify.report.service.ReportGenerationService;
import io.fleetify.report.service.ReportJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportGenerationService reportService;
    private final ReportJobService reportJobService;

    // ==================== ASYNC ENDPOINTS (RabbitMQ) ====================

    /**
     * Queue a report generation job (async)
     * Returns a job ID for polling
     */
    @PostMapping("/request/{reportType}")
    public ResponseEntity<ReportJobResponse> requestReport(
            @PathVariable String reportType,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ReportRequest request) {
        
        log.info("Received async report request for type: {}", reportType);
        
        // Validate report type
        if (!isValidReportType(reportType)) {
            return ResponseEntity.badRequest().body(
                    ReportJobResponse.builder()
                            .status("ERROR")
                            .message("Nieznany typ raportu: " + reportType)
                            .build()
            );
        }
        
        ReportJobResponse response = reportJobService.queueReportJob(reportType, request, authorization);
        
        return ResponseEntity.accepted().body(response);
    }

    /**
     * Check report generation status
     */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<ReportJobResponse> getReportStatus(@PathVariable String jobId) {
        log.info("Checking status for job: {}", jobId);
        
        ReportJobResponse response = reportJobService.getJobStatus(jobId);
        
        if ("NOT_FOUND".equals(response.getStatus())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Download generated report
     */
    @GetMapping("/download/{jobId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String jobId) {
        log.info("Download request for job: {}", jobId);
        
        if (!reportJobService.isReportReady(jobId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body("{\"error\": \"Report not ready or not found\"}".getBytes());
        }
        
        byte[] pdfContent = reportJobService.getReportResult(jobId);
        
        if (pdfContent == null || pdfContent.length == 0) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body("{\"error\": \"Report content is empty\"}".getBytes());
        }
        
        String filename = String.format("report-%s.pdf", jobId.substring(0, 8));
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfContent.length)
                .body(pdfContent);
    }

    // ==================== SYNC ENDPOINTS (Legacy, direct generation) ====================

    /**
     * Generate a fleet summary report (PDF)
     */
    @PostMapping("/fleet-summary")
    public ResponseEntity<byte[]> generateFleetSummaryReport(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ReportRequest request) {
        
        log.info("Generating fleet summary report for period: {} - {}", 
                request.getStartDate(), request.getEndDate());
        
        byte[] pdfContent = reportService.generateFleetSummaryReport(request, authorization);
        
        String filename = String.format("fleet-summary-%s.pdf", 
                java.time.LocalDate.now().toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    /**
     * Generate a vehicle utilization report (PDF)
     */
    @PostMapping("/vehicle-utilization")
    public ResponseEntity<byte[]> generateVehicleUtilizationReport(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ReportRequest request) {
        
        log.info("Generating vehicle utilization report");
        
        byte[] pdfContent = reportService.generateVehicleUtilizationReport(request, authorization);
        
        String filename = String.format("vehicle-utilization-%s.pdf", 
                java.time.LocalDate.now().toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    /**
     * Generate a cost analysis report (PDF)
     */
    @PostMapping("/cost-analysis")
    public ResponseEntity<byte[]> generateCostAnalysisReport(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ReportRequest request) {
        
        log.info("Generating cost analysis report");
        
        byte[] pdfContent = reportService.generateCostAnalysisReport(request, authorization);
        
        String filename = String.format("cost-analysis-%s.pdf", 
                java.time.LocalDate.now().toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    /**
     * Generate a driver/employee trips report (PDF)
     */
    @PostMapping("/trips")
    public ResponseEntity<byte[]> generateTripsReport(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ReportRequest request) {
        
        log.info("Generating trips report");
        
        byte[] pdfContent = reportService.generateTripsReport(request, authorization);
        
        String filename = String.format("trips-report-%s.pdf", 
                java.time.LocalDate.now().toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Report Service is running");
    }

    private boolean isValidReportType(String reportType) {
        return reportType != null && (
                reportType.equals("fleet-summary") ||
                reportType.equals("vehicle-utilization") ||
                reportType.equals("cost-analysis") ||
                reportType.equals("trips")
        );
    }
}
