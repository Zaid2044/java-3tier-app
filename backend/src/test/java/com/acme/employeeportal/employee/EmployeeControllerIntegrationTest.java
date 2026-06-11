package com.acme.employeeportal.employee;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class EmployeeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void createsSearchesAndDeletesEmployee() throws Exception {
        String employee = """
                {
                  "name": "Ada Lovelace",
                  "email": "ada@example.com",
                  "department": "ENGINEERING",
                  "salary": 145000
                }
                """;

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(employee))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.departmentDisplayName").value("Engineering"));

        mockMvc.perform(get("/api/employees").param("search", "ada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email").value("ada@example.com"));

        Long employeeId = repository.findByEmailIgnoreCase("ada@example.com").orElseThrow().getId();
        mockMvc.perform(delete("/api/employees/{id}", employeeId))
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsInvalidAndDuplicateEmails() throws Exception {
        String valid = """
                {"name":"Grace Hopper","email":"grace@example.com","department":"ENGINEERING","salary":150000}
                """;
        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(valid))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(valid))
                .andExpect(status().isConflict());

        String invalid = """
                {"name":"","email":"not-an-email","department":"HR","salary":-1}
                """;
        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.salary").exists());
    }
}
