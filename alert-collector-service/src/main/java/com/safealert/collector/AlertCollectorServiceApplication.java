package com.safealert.collector;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AlertCollectorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlertCollectorServiceApplication.class, args);
    }
}