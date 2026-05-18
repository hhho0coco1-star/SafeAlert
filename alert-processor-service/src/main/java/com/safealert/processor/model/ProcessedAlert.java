package com.safealert.processor.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@Document(collection = "processed_alerts")
public class ProcessedAlert {

    @Id
    private String id;
    private String source;
    private String category;
    private String title;
    private String content;
    private String region;
    private String severity;
    private String issuedAt;
    private LocalDateTime processedAt;
}
