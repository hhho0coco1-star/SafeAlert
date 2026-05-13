package com.safealert.auth.dto;

import lombok.Getter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Getter
public class ApiResponse<T> {
    private final boolean success;
    private final T data;
    private final String message;
    private final String timestamp;

    private ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, "OK");
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}