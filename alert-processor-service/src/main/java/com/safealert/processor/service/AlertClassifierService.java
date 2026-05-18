package com.safealert.processor.service;

import org.springframework.stereotype.Service;

@Service
public class AlertClassifierService {

    public String classifySeverity(String source, String content) {
        if (content == null) return "LOW";

        String lower = content.toLowerCase();

        if (source.equals("DISASTER")) {
            return "HIGH";
        }
        if (source.equals("WEATHER")) {
            if (lower.contains("태풍") || lower.contains("홍수") || lower.contains("대설")) {
                return "HIGH";
            }
            return "MEDIUM";
        }
        if (source.equals("DUST")) {
            if (lower.contains("매우나쁨") || lower.contains("위험")) {
                return "HIGH";
            }
            if (lower.contains("나쁨")) {
                return "MEDIUM";
            }
            return "LOW";
        }
        return "LOW";
    }
}
