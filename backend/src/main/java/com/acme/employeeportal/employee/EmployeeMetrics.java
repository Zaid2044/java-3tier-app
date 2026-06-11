package com.acme.employeeportal.employee;

import java.math.BigDecimal;
import java.util.Map;

public record EmployeeMetrics(
        long totalEmployees,
        long departments,
        BigDecimal averageSalary,
        long newEmployees,
        Map<String, Long> departmentDistribution
) {
}
