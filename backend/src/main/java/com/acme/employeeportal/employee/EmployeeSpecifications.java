package com.acme.employeeportal.employee;

import org.springframework.data.jpa.domain.Specification;

final class EmployeeSpecifications {

    private EmployeeSpecifications() {
    }

    static Specification<Employee> matches(String search, Department department) {
        return (root, query, builder) -> {
            var departmentPredicate = department == null
                    ? builder.conjunction()
                    : builder.equal(root.get("department"), department);
            if (search == null || search.isBlank()) {
                return departmentPredicate;
            }
            String value = "%" + search.trim().toLowerCase() + "%";
            var searchPredicate = builder.or(
                    builder.like(builder.lower(root.get("name")), value),
                    builder.like(builder.lower(root.get("email")), value),
                    builder.like(builder.lower(root.get("department").as(String.class)), value)
            );
            return builder.and(departmentPredicate, searchPredicate);
        };
    }
}
