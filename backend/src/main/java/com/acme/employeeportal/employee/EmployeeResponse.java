package com.acme.employeeportal.employee;

import java.math.BigDecimal;
import java.time.Instant;

public record EmployeeResponse(
        Long id,
        String name,
        String email,
        Department department,
        String departmentDisplayName,
        BigDecimal salary,
        Instant createdAt,
        Instant updatedAt
) {
    static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getDepartment().getDisplayName(),
                employee.getSalary(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
