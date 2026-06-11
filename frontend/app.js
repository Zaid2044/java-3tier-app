"use strict";

const state = {
    employees: [],
    page: 0,
    size: 8,
    totalPages: 0,
    totalElements: 0,
    search: "",
    department: "",
    sortBy: "updatedAt",
    direction: "desc",
    deletingId: null
};

const elements = {
    tableBody: document.querySelector("#employeeTableBody"),
    loading: document.querySelector("#loadingState"),
    empty: document.querySelector("#emptyState"),
    summary: document.querySelector("#paginationSummary"),
    pageNumbers: document.querySelector("#pageNumbers"),
    previous: document.querySelector("#previousPage"),
    next: document.querySelector("#nextPage"),
    globalSearch: document.querySelector("#globalSearch"),
    tableSearch: document.querySelector("#tableSearch"),
    departmentFilter: document.querySelector("#departmentFilter"),
    employeeDialog: document.querySelector("#employeeDialog"),
    deleteDialog: document.querySelector("#deleteDialog"),
    form: document.querySelector("#employeeForm"),
    saveButton: document.querySelector("#saveEmployeeButton"),
    confirmDelete: document.querySelector("#confirmDeleteButton")
};

const icons = {
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12Zm3.46-7.12 1.41-1.41L12 11.59l1.12-1.12 1.41 1.41L13.41 13l1.12 1.12-1.41 1.41L12 14.41l-1.12 1.12-1.41-1.41L10.59 13l-1.13-1.12ZM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5Z"/></svg>'
};

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
});

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    Promise.all([loadEmployees(), loadMetrics()]);
});

function bindEvents() {
    document.querySelector("#addEmployeeButton").addEventListener("click", openCreateDialog);
    document.querySelectorAll("[data-close-dialog]").forEach(button =>
        button.addEventListener("click", () => elements.employeeDialog.close()));
    document.querySelectorAll("[data-close-delete]").forEach(button =>
        button.addEventListener("click", () => elements.deleteDialog.close()));

    elements.form.addEventListener("submit", saveEmployee);
    elements.confirmDelete.addEventListener("click", deleteEmployee);
    elements.previous.addEventListener("click", () => changePage(state.page - 1));
    elements.next.addEventListener("click", () => changePage(state.page + 1));
    elements.departmentFilter.addEventListener("change", event => {
        state.department = event.target.value;
        state.page = 0;
        loadEmployees();
    });

    const handleSearch = debounce(value => {
        state.search = value.trim();
        state.page = 0;
        elements.globalSearch.value = value;
        elements.tableSearch.value = value;
        loadEmployees();
    }, 350);
    elements.globalSearch.addEventListener("input", event => handleSearch(event.target.value));
    elements.tableSearch.addEventListener("input", event => handleSearch(event.target.value));

    document.querySelectorAll(".sort-button").forEach(button => {
        button.addEventListener("click", () => {
            const nextSort = button.dataset.sort;
            state.direction = state.sortBy === nextSort && state.direction === "asc" ? "desc" : "asc";
            state.sortBy = nextSort;
            state.page = 0;
            updateSortIndicators();
            loadEmployees();
        });
    });

    document.querySelector(".mobile-menu").addEventListener("click", () =>
        document.querySelector(".sidebar").classList.toggle("open"));
    document.addEventListener("keydown", event => {
        if (event.key === "/" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
            event.preventDefault();
            elements.globalSearch.focus();
        }
        if (event.key === "Escape") {
            document.querySelector(".sidebar").classList.remove("open");
        }
    });
}

async function loadEmployees() {
    setLoading(true);
    try {
        const query = new URLSearchParams({
            search: state.search,
            page: state.page,
            size: state.size,
            sortBy: state.sortBy,
            direction: state.direction
        });
        if (state.department) {
            query.set("department", state.department);
        }
        const response = await api(`/api/employees?${query}`);
        state.employees = response.content;
        state.totalPages = response.totalPages;
        state.totalElements = response.totalElements;
        renderEmployees();
        renderPagination();
    } catch (error) {
        showToast(error.message, true);
        elements.empty.classList.remove("hidden");
    } finally {
        setLoading(false);
    }
}

async function loadMetrics() {
    try {
        const metrics = await api("/metrics");
        document.querySelector("#totalEmployees").textContent = metrics.totalEmployees.toLocaleString();
        document.querySelector("#departmentCount").textContent = metrics.departments;
        document.querySelector("#averageSalary").textContent = currency.format(metrics.averageSalary);
        document.querySelector("#newEmployees").textContent = metrics.newEmployees;
    } catch (error) {
        showToast("Workforce metrics are temporarily unavailable.", true);
    }
}

function renderEmployees() {
    elements.tableBody.innerHTML = "";
    elements.empty.classList.toggle("hidden", state.employees.length !== 0);
    state.employees.forEach(employee => {
        const row = document.createElement("tr");
        const initials = employee.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
        row.innerHTML = `
            <td><div class="employee-cell"><span class="employee-avatar">${escapeHtml(initials)}</span><div><strong>${escapeHtml(employee.name)}</strong><small>ID ${String(employee.id).padStart(4, "0")}</small></div></div></td>
            <td>${escapeHtml(employee.email)}</td>
            <td><span class="department-badge ${employee.departmentDisplayName.toLowerCase()}">${escapeHtml(employee.departmentDisplayName)}</span></td>
            <td>${currency.format(employee.salary)}</td>
            <td>${dateFormat.format(new Date(employee.updatedAt))}</td>
            <td><div class="action-buttons"><button class="row-button edit" type="button" aria-label="Edit ${escapeHtml(employee.name)}">${icons.edit}</button><button class="row-button delete" type="button" aria-label="Delete ${escapeHtml(employee.name)}">${icons.delete}</button></div></td>`;
        row.querySelector(".edit").addEventListener("click", () => openEditDialog(employee));
        row.querySelector(".delete").addEventListener("click", () => openDeleteDialog(employee));
        elements.tableBody.appendChild(row);
    });
}

function renderPagination() {
    const first = state.totalElements === 0 ? 0 : state.page * state.size + 1;
    const last = Math.min((state.page + 1) * state.size, state.totalElements);
    elements.summary.textContent = `Showing ${first}–${last} of ${state.totalElements} employees`;
    elements.previous.disabled = state.page <= 0;
    elements.next.disabled = state.page >= state.totalPages - 1 || state.totalPages === 0;
    elements.pageNumbers.innerHTML = "";

    const start = Math.max(0, Math.min(state.page - 1, state.totalPages - 3));
    const end = Math.min(state.totalPages, start + 3);
    for (let page = start; page < end; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `page-button${page === state.page ? " active" : ""}`;
        button.textContent = page + 1;
        button.setAttribute("aria-label", `Page ${page + 1}`);
        button.addEventListener("click", () => changePage(page));
        elements.pageNumbers.appendChild(button);
    }
}

function changePage(page) {
    if (page >= 0 && page < state.totalPages && page !== state.page) {
        state.page = page;
        loadEmployees();
    }
}

function openCreateDialog() {
    elements.form.reset();
    clearErrors();
    document.querySelector("#employeeId").value = "";
    document.querySelector("#employeeDialogTitle").textContent = "Add employee";
    elements.saveButton.textContent = "Add employee";
    elements.employeeDialog.showModal();
    document.querySelector("#employeeName").focus();
}

function openEditDialog(employee) {
    clearErrors();
    document.querySelector("#employeeId").value = employee.id;
    document.querySelector("#employeeName").value = employee.name;
    document.querySelector("#employeeEmail").value = employee.email;
    document.querySelector("#employeeDepartment").value = employee.department;
    document.querySelector("#employeeSalary").value = employee.salary;
    document.querySelector("#employeeDialogTitle").textContent = "Edit employee";
    elements.saveButton.textContent = "Save changes";
    elements.employeeDialog.showModal();
}

function openDeleteDialog(employee) {
    state.deletingId = employee.id;
    document.querySelector("#deleteEmployeeName").textContent = employee.name;
    elements.deleteDialog.showModal();
}

async function saveEmployee(event) {
    event.preventDefault();
    clearErrors();
    const id = document.querySelector("#employeeId").value;
    const payload = {
        name: document.querySelector("#employeeName").value.trim(),
        email: document.querySelector("#employeeEmail").value.trim(),
        department: document.querySelector("#employeeDepartment").value,
        salary: Number(document.querySelector("#employeeSalary").value)
    };

    if (!validateForm(payload)) {
        return;
    }

    setButtonBusy(elements.saveButton, true, id ? "Saving..." : "Adding...");
    try {
        await api(id ? `/api/employees/${id}` : "/api/employees", {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        elements.employeeDialog.close();
        showToast(id ? "Employee record updated." : "Employee added successfully.");
        await Promise.all([loadEmployees(), loadMetrics()]);
    } catch (error) {
        if (error.validationErrors) {
            Object.entries(error.validationErrors).forEach(([field, message]) => showFieldError(field, message));
        } else {
            showToast(error.message, true);
        }
    } finally {
        setButtonBusy(elements.saveButton, false, id ? "Save changes" : "Add employee");
    }
}

async function deleteEmployee() {
    setButtonBusy(elements.confirmDelete, true, "Deleting...");
    try {
        await api(`/api/employees/${state.deletingId}`, { method: "DELETE" });
        elements.deleteDialog.close();
        if (state.employees.length === 1 && state.page > 0) {
            state.page -= 1;
        }
        showToast("Employee deleted.");
        await Promise.all([loadEmployees(), loadMetrics()]);
    } catch (error) {
        showToast(error.message, true);
    } finally {
        setButtonBusy(elements.confirmDelete, false, "Delete employee");
        state.deletingId = null;
    }
}

function validateForm(payload) {
    let valid = true;
    if (!payload.name) {
        showFieldError("name", "Full name is required.");
        valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        showFieldError("email", "Enter a valid work email.");
        valid = false;
    }
    if (!payload.department) {
        showFieldError("department", "Select a department.");
        valid = false;
    }
    if (!Number.isFinite(payload.salary) || payload.salary < 0) {
        showFieldError("salary", "Enter a valid non-negative salary.");
        valid = false;
    }
    return valid;
}

function showFieldError(field, message) {
    const element = document.querySelector(`[data-error-for="${field}"]`);
    if (element) {
        element.textContent = message;
    }
}

function clearErrors() {
    document.querySelectorAll(".field-error").forEach(element => {
        element.textContent = "";
    });
}

function updateSortIndicators() {
    document.querySelectorAll(".sort-button").forEach(button => {
        button.querySelector("span").textContent =
            button.dataset.sort === state.sortBy ? (state.direction === "asc" ? "↑" : "↓") : "↕";
    });
}

function setLoading(loading) {
    elements.loading.classList.toggle("hidden", !loading);
}

function setButtonBusy(button, busy, text) {
    button.disabled = busy;
    button.textContent = text;
}

async function api(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 204) {
        return null;
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(body.message || "The request could not be completed.");
        error.validationErrors = body.validationErrors;
        throw error;
    }
    return body;
}

function showToast(message, error = false) {
    const toast = document.createElement("div");
    toast.className = `toast${error ? " error" : ""}`;
    toast.textContent = message;
    document.querySelector("#toastContainer").appendChild(toast);
    window.setTimeout(() => toast.remove(), 3800);
}

function debounce(callback, delay) {
    let timer;
    return value => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => callback(value), delay);
    };
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value);
    return element.innerHTML;
}
