package com.acme.employeeportal.config;

import com.acme.employeeportal.employee.Department;
import com.acme.employeeportal.employee.Employee;
import com.acme.employeeportal.employee.EmployeeRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

@Configuration
@ConditionalOnProperty(name = "app.demo-data-enabled", havingValue = "true")
public class DemoDataConfiguration implements ApplicationRunner {

    private final EmployeeRepository repository;

    public DemoDataConfiguration(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }
        repository.saveAll(List.of(
                employee("Maya Chen", "maya.chen@acme.example", Department.ENGINEERING, "142000"),
                employee("Liam Carter", "liam.carter@acme.example", Department.FINANCE, "118500"),
                employee("Sofia Martinez", "sofia.martinez@acme.example", Department.MARKETING, "107000"),
                employee("Noah Williams", "noah.williams@acme.example", Department.OPERATIONS, "112500"),
                employee("Ava Thompson", "ava.thompson@acme.example", Department.HR, "98500"),
                employee("Ethan Patel", "ethan.patel@acme.example", Department.SALES, "125000"),
                employee("Isabella Kim", "isabella.kim@acme.example", Department.ENGINEERING, "138000"),
                employee("Lucas Anderson", "lucas.anderson@acme.example", Department.SALES, "121000")
        ));
    }

    private Employee employee(String name, String email, Department department, String salary) {
        Employee employee = new Employee();
        employee.setName(name);
        employee.setEmail(email);
        employee.setDepartment(department);
        employee.setSalary(new BigDecimal(salary));
        return employee;
    }
}
