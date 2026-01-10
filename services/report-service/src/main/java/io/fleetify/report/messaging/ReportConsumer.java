package io.fleetify.report.messaging;

import io.fleetify.report.config.RabbitMQConfig;
import io.fleetify.report.dto.ReportJob;
import io.fleetify.report.dto.ReportJob.JobStatus;
import io.fleetify.report.dto.ReportRequest;
import io.fleetify.report.service.ReportGenerationService;
import io.fleetify.report.service.ReportJobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportConsumer {

    private final ReportGenerationService reportGenerationService;
    private final ReportJobService reportJobService;

    @RabbitListener(queues = RabbitMQConfig.REPORT_QUEUE)
    public void processReportJob(ReportJob job) {
        String jobId = job.getJobId();
        log.info("Processing report job: {} (type: {})", jobId, job.getReportType());
        
        try {
            // Update status to processing
            reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 10, null);
            
            // Create request from job
            ReportRequest request = ReportRequest.builder()
                    .startDate(job.getStartDate())
                    .endDate(job.getEndDate())
                    .includeCharts(job.getIncludeCharts())
                    .includeSummary(job.getIncludeSummary())
                    .build();
            
            String authorization = job.getAuthorization();
            byte[] pdfContent = null;
            
            // Update progress
            reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 30, null);
            
            // Generate report based on type
            switch (job.getReportType()) {
                case "fleet-summary":
                    reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 50, null);
                    pdfContent = reportGenerationService.generateFleetSummaryReport(request, authorization);
                    break;
                case "vehicle-utilization":
                    reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 50, null);
                    pdfContent = reportGenerationService.generateVehicleUtilizationReport(request, authorization);
                    break;
                case "cost-analysis":
                    reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 50, null);
                    pdfContent = reportGenerationService.generateCostAnalysisReport(request, authorization);
                    break;
                case "trips":
                    reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 50, null);
                    pdfContent = reportGenerationService.generateTripsReport(request, authorization);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown report type: " + job.getReportType());
            }
            
            // Update progress
            reportJobService.updateJobStatus(jobId, JobStatus.PROCESSING, 90, null);
            
            if (pdfContent != null && pdfContent.length > 0) {
                // Store result
                reportJobService.storeReportResult(jobId, pdfContent);
                log.info("Report job {} completed successfully ({} bytes)", jobId, pdfContent.length);
            } else {
                throw new RuntimeException("Generated PDF is empty");
            }
            
        } catch (Exception e) {
            log.error("Failed to process report job {}: {}", jobId, e.getMessage(), e);
            reportJobService.updateJobStatus(jobId, JobStatus.FAILED, 0, e.getMessage());
        }
    }
}
