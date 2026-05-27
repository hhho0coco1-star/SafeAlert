package com.safealert.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class AdminUsersResponse {

    private long totalCount;
    private List<MeResponse> users;
    private int page;
    private int totalPages;

}
