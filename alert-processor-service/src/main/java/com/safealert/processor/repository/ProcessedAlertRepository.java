package com.safealert.processor.repository;

import com.safealert.processor.model.ProcessedAlert;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProcessedAlertRepository extends MongoRepository<ProcessedAlert, String> {
}
