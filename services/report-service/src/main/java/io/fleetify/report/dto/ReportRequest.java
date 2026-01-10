package io.fleetify.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("report_type")
    private String reportType;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("vehicle_id")
    private String vehicleId;

    @JsonProperty("include_charts")
    @Builder.Default
    private Boolean includeCharts = true;

    @JsonProperty("include_summary")
    @Builder.Default
    private Boolean includeSummary = true;
}
