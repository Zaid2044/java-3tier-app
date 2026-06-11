package com.acme.employeeportal.employee;

import com.acme.employeeportal.error.ConflictException;
import com.acme.employeeportal.error.ResourceNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);
    private final EmployeeRepository repository;

    public EmployeeService(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(String search, Department department, Pageable pageable) {
        return repository.findAll(EmployeeSpecifications.matches(search, department), pageable)
                .map(EmployeeResponse::from);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse findById(Long id) {
        return EmployeeResponse.from(getEmployee(id));
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        ensureEmailAvailable(request.email(), null);
        Employee employee = new Employee();
        apply(employee, request);
        Employee saved = repository.save(employee);
        log.info("employee_created employeeId={} department={}", saved.getId(), saved.getDepartment());
        return EmployeeResponse.from(saved);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = getEmployee(id);
        ensureEmailAvailable(request.email(), id);
        apply(employee, request);
        Employee saved = repository.save(employee);
        log.info("employee_updated employeeId={} department={}", saved.getId(), saved.getDepartment());
        return EmployeeResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = getEmployee(id);
        repository.delete(employee);
        log.info("employee_deleted employeeId={}", id);
    }

    @Transactional(readOnly = true)
    public EmployeeMetrics metrics() {
        Map<String, Long> distribution = new LinkedHashMap<>();
        Arrays.stream(Department.values())
                .forEach(department -> distribution.put(department.getDisplayName(), 0L));
        repository.countByDepartment().forEach(row -> {
            Department department = (Department) row[0];
            distribution.put(department.getDisplayName(), (Long) row[1]);
        });

        long activeDepartments = distribution.values().stream().filter(count -> count > 0).count();
        Double average = repository.findAverageSalary();
        BigDecimal averageSalary = average == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP);

        return new EmployeeMetrics(
                repository.count(),
                activeDepartments,
                averageSalary,
                repository.countByCreatedAtGreaterThanEqual(Instant.now().minus(30, ChronoUnit.DAYS)),
                distribution
        );
    }

    private Employee getEmployee(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee " + id + " was not found"));
    }

    private void ensureEmailAvailable(String email, Long currentId) {
        repository.findByEmailIgnoreCase(email.trim()).ifPresent(existing -> {
            if (!existing.getId().equals(currentId)) {
                throw new ConflictException("An employee with this email already exists");
            }
        });
    }

    private void apply(Employee employee, EmployeeRequest request) {
        employee.setName(request.name().trim());
        employee.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        employee.setDepartment(request.department());
        employee.setSalary(request.salary().setScale(2, RoundingMode.HALF_UP));
    }
}
