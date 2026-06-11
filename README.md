# Acme People Employee Management Portal

A production-oriented, beginner-friendly three-tier employee portal built with Java 21, Spring Boot 3, PostgreSQL, Nginx, HTML, CSS, and vanilla JavaScript..

## Architecture

```text
Browser
  |
  v
Nginx frontend :8080
  |
  v
Spring Boot API :8080 (internal only)
  |
  v
PostgreSQL :5432 (internal only)
```

Only Nginx is published to the host. The backend and database communicate over the private Compose network.

## Run the application

Requirements:

- Docker Engine 24+
- Docker Compose v2

Start the full stack:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

The first start seeds eight demonstration employees. Disable this behavior with:

```bash
DEMO_DATA_ENABLED=false docker compose up --build
```

On PowerShell:

```powershell
$env:DEMO_DATA_ENABLED="false"
docker compose up --build
```

Stop the services:

```bash
docker compose down
```

Stop the services and delete the PostgreSQL data volume:

```bash
docker compose down --volumes
```

## Configuration

Compose has development-friendly defaults and runs without an `.env` file. For non-local environments, copy `.env.example` to `.env` and change the database password.

| Variable | Default | Purpose |
|---|---|---|
| `APP_PORT` | `8080` | Host port for the portal |
| `POSTGRES_DB` | `employee_portal` | PostgreSQL database |
| `POSTGRES_USER` | `employee_app` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `employee_secret` | PostgreSQL password |
| `DB_POOL_SIZE` | `10` | Maximum backend connection pool size |
| `DEMO_DATA_ENABLED` | `true` | Seed sample employees when the database is empty |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health |
| `GET` | `/metrics` | Workforce summary metrics |
| `POST` | `/api/employees` | Create an employee |
| `GET` | `/api/employees` | Search, sort, and paginate employees |
| `GET` | `/api/employees/{id}` | Get one employee |
| `PUT` | `/api/employees/{id}` | Update an employee |
| `DELETE` | `/api/employees/{id}` | Delete an employee |

List query parameters:

- `search`: matches name, email, or department
- `department`: optional exact enum filter
- `page`: zero-based page number
- `size`: page size from 1 to 100
- `sortBy`: `id`, `name`, `email`, `department`, `salary`, `createdAt`, or `updatedAt`
- `direction`: `asc` or `desc`

Example:

```text
GET /api/employees?search=engineering&page=0&size=10&sortBy=name&direction=asc
```

Create or update request:

```json
{
  "name": "Morgan Lee",
  "email": "morgan.lee@acme.example",
  "department": "ENGINEERING",
  "salary": 125000.00
}
```

Department values are `ENGINEERING`, `HR`, `FINANCE`, `OPERATIONS`, `MARKETING`, and `SALES`.

## Backend tests

The test suite uses an in-memory H2 database in PostgreSQL compatibility mode:

```bash
cd backend
mvn test
```

## Production notes

- Supply secrets through your deployment platform rather than committing `.env`.
- Put TLS at the ingress, load balancer, or Nginx layer.
- Replace Hibernate `ddl-auto=update` with Flyway migrations before managing long-lived production schemas.
- Back up the named PostgreSQL volume and monitor disk usage.
- Centralize the JSON logs emitted by the backend.
