package io.fleetify.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportJob {
    
    private String jobId;
    private String reportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String authorization;
    private Boolean includeCharts;
    private Boolean includeSummary;
    
    private JobStatus status;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private Integer progress;
    
    public enum JobStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
