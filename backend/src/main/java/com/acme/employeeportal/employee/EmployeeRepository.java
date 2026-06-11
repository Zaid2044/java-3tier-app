package com.acme.employeeportal.employee;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmailIgnoreCase(String email);

    long countByCreatedAtGreaterThanEqual(Instant since);

    @Query("select avg(e.salary) from Employee e")
    Double findAverageSalary();

    @Query("select e.department, count(e) from Employee e group by e.department")
    List<Object[]> countByDepartment();
}
