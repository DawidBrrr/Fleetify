package io.fleetify.report.service;

import io.fleetify.report.config.RabbitMQConfig;
import io.fleetify.report.dto.ReportJob;
import io.fleetify.report.dto.ReportJob.JobStatus;
import io.fleetify.report.dto.ReportJobResponse;
import io.fleetify.report.dto.ReportRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportJobService {

    private final RabbitTemplate rabbitTemplate;

    // In-memory storage for job status and results
    // In production, use Redis or a database
    private final Map<String, ReportJob> jobStore = new ConcurrentHashMap<>();
    private final Map<String, byte[]> reportStore = new ConcurrentHashMap<>();

    /**
     * Queue a new report generation job
     */
    public ReportJobResponse queueReportJob(String reportType, ReportRequest request, String authorization) {
        String jobId = UUID.randomUUID().toString();
        
        ReportJob job = ReportJob.builder()
                .jobId(jobId)
                .reportType(reportType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .authorization(authorization)
                .includeCharts(request.getIncludeCharts())
                .includeSummary(request.getIncludeSummary())
                .status(JobStatus.PENDING)
                .progress(0)
                .createdAt(LocalDateTime.now())
                .build();
        
        // Store job
        jobStore.put(jobId, job);
        
        log.info("Queueing report job {} for type {}", jobId, reportType);
        
        // Send to RabbitMQ
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.REPORT_EXCHANGE,
                    RabbitMQConfig.REPORT_ROUTING_KEY,
                    job
            );
            log.info("Job {} sent to queue successfully", jobId);
        } catch (Exception e) {
            log.error("Failed to send job {} to queue: {}", jobId, e.getMessage());
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage("Failed to queue job: " + e.getMessage());
            jobStore.put(jobId, job);
        }
        
        return buildResponse(job);
    }

    /**
     * Get job status
     */
    public ReportJobResponse getJobStatus(String jobId) {
        ReportJob job = jobStore.get(jobId);
        
        if (job == null) {
            return ReportJobResponse.builder()
                    .jobId(jobId)
                    .status("NOT_FOUND")
                    .message("Job not found")
                    .build();
        }
        
        return buildResponse(job);
    }

    /**
     * Get generated report PDF
     */
    public byte[] getReportResult(String jobId) {
        return reportStore.get(jobId);
    }

    /**
     * Check if report is ready
     */
    public boolean isReportReady(String jobId) {
        ReportJob job = jobStore.get(jobId);
        return job != null && job.getStatus() == JobStatus.COMPLETED && reportStore.containsKey(jobId);
    }

    /**
     * Update job status - called by consumer
     */
    public void updateJobStatus(String jobId, JobStatus status, Integer progress, String errorMessage) {
        ReportJob job = jobStore.get(jobId);
        if (job != null) {
            job.setStatus(status);
            job.setProgress(progress);
            job.setErrorMessage(errorMessage);
            if (status == JobStatus.COMPLETED || status == JobStatus.FAILED) {
                job.setCompletedAt(LocalDateTime.now());
            }
            jobStore.put(jobId, job);
            log.info("Updated job {} status to {} (progress: {}%)", jobId, status, progress);
        }
    }

    /**
     * Store generated report - called by consumer
     */
    public void storeReportResult(String jobId, byte[] pdfContent) {
        reportStore.put(jobId, pdfContent);
        updateJobStatus(jobId, JobStatus.COMPLETED, 100, null);
        log.info("Stored report result for job {} ({} bytes)", jobId, pdfContent.length);
    }

    /**
     * Get job details - used by consumer
     */
    public ReportJob getJob(String jobId) {
        return jobStore.get(jobId);
    }

    private ReportJobResponse buildResponse(ReportJob job) {
        ReportJobResponse.ReportJobResponseBuilder builder = ReportJobResponse.builder()
                .jobId(job.getJobId())
                .reportType(job.getReportType())
                .status(job.getStatus().name())
                .progress(job.getProgress())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt());
        
        if (job.getStatus() == JobStatus.COMPLETED) {
            builder.downloadUrl("/api/reports/download/" + job.getJobId());
            builder.message("Raport jest gotowy do pobrania");
        } else if (job.getStatus() == JobStatus.PROCESSING) {
            builder.message("Generowanie raportu w toku...");
        } else if (job.getStatus() == JobStatus.PENDING) {
            builder.message("Raport oczekuje w kolejce");
        } else if (job.getStatus() == JobStatus.FAILED) {
            builder.message("Generowanie raportu nie powiodło się");
        }
        
        return builder.build();
    }

    /**
     * Cleanup old jobs (could be scheduled)
     */
    public void cleanupOldJobs(int maxAgeMinutes) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(maxAgeMinutes);
        jobStore.entrySet().removeIf(entry -> 
                entry.getValue().getCreatedAt() != null && 
                entry.getValue().getCreatedAt().isBefore(threshold));
        
        // Also cleanup orphaned reports
        reportStore.keySet().removeIf(jobId -> !jobStore.containsKey(jobId));
    }
}
