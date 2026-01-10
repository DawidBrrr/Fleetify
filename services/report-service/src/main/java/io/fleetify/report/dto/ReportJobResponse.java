package io.fleetify.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportJobResponse {
    
    @JsonProperty("job_id")
    private String jobId;
    
    @JsonProperty("report_type")
    private String reportType;
    
    private String status;
    
    private Integer progress;
    
    @JsonProperty("error_message")
    private String errorMessage;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("completed_at")
    private LocalDateTime completedAt;
    
    @JsonProperty("download_url")
    private String downloadUrl;
    
    private String message;
}
