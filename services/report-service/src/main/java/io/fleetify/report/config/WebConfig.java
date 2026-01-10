package io.fleetify.report.config;

import org.springframework.context.annotation.Configuration;

/**
 * Web configuration for Report Service.
 * 
 * Note: CORS is handled by the nginx gateway, so we don't configure it here
 * to avoid duplicate Access-Control-Allow-Origin headers.
 */
@Configuration
public class WebConfig {
    // CORS handled by nginx gateway
}
