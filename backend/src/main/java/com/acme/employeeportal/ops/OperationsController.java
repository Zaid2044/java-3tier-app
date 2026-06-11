package com.acme.employeeportal.ops;

import com.acme.employeeportal.employee.EmployeeMetrics;
import com.acme.employeeportal.employee.EmployeeService;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OperationsController {

    private final EmployeeService employeeService;

    public OperationsController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "employee-portal-api",
                "timestamp", Instant.now()
        );
    }

    @GetMapping("/metrics")
    public EmployeeMetrics metrics() {
        return employeeService.metrics();
    }
}
