package com.acme.employeeportal.employee;

public enum Department {
    ENGINEERING("Engineering"),
    HR("HR"),
    FINANCE("Finance"),
    OPERATIONS("Operations"),
    MARKETING("Marketing"),
    SALES("Sales");

    private final String displayName;

    Department(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
