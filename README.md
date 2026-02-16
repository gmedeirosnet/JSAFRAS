# DevSecOps Interview Task - J. Safra Sarasin

This repository implements a DevSecOps practical task: build two Web APIs that record device types used for authentication, persist events in PostgreSQL, and deploy the full stack with Docker Compose using network isolation.

## What is included

- StatisticsAPI (public, host port 8080): validates input, calls the internal API, returns a mapped response, and exposes a statistics endpoint.
- DeviceRegistrationAPI (internal): validates input and inserts registrations into PostgreSQL.
- PostgreSQL (internal): stores device registration events.

## Architecture

- The host can access only the StatisticsAPI on port 8080.
- DeviceRegistrationAPI and PostgreSQL are on an internal-only network.

## Quick start

Prerequisites:
- Docker and Docker Compose

Run:

```bash
docker compose up --build -d
docker compose ps
```

Stop:

```bash
docker compose down -v
```

## API

StatisticsAPI (public)

- `GET /health` -> `{ "status": "ok", "service": "statistics-api" }`
- `POST /Log/auth` -> `{ "statusCode": 200, "message": "success" }` or `{ "statusCode": 400, "message": "bad_request" }`
- `GET /Log/auth/statistics?deviceType=iOS` -> `{ "deviceType": "iOS", "count": number }` (returns `count: -1` on error)

DeviceRegistrationAPI (internal)

- `GET /health` -> `{ "status": "ok", "service": "device-registration-api" }`
- `POST /Device/register` -> `{ "statusCode": 200 }` or `{ "statusCode": 400 }`

Allowed `deviceType` values: `iOS`, `Android`, `Watch`, `TV`.

## Example requests

```bash
curl http://localhost:8080/health

curl -X POST http://localhost:8080/Log/auth \
  -H "Content-Type: application/json" \
  -d '{"userKey": "user123", "deviceType": "iOS"}'

curl "http://localhost:8080/Log/auth/statistics?deviceType=iOS"
```

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL host | `postgres` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `devicesdb` |
| `POSTGRES_USER` | Database user | `appuser` |
| `POSTGRES_PASSWORD` | Database password | `apppassword123` |
| `DEVICE_REGISTRATION_API_URL` | Internal API URL | `http://device-registration-api:3001` |

## DevSecOps notes

- Input validation is enforced on all endpoints.
- Containers run as non-root.
- Network isolation is applied via separate Docker networks.
- Health endpoints are provided for orchestration.
- CI runs dependency auditing and container image scanning.

## CI/CD

The workflow in `.github/workflows/ci.yml` runs security checks, builds images, runs integration checks via Docker Compose, and can push images to DockerHub (requires repository secrets).

## Project structure

```
.
├── .env
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
├── docker-compose.yml
├── deploy/
│   └── postgres/
│       └── init.sql
└── services/
    ├── device-registration-api/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    └── statistics-api/
        ├── Dockerfile
        ├── package.json
        └── src/
```

## Design decisions

- `count` is the total number of rows in `device_registrations` for a given `device_type` (not unique users).
- Each `POST` creates a new row (no deduplication).
- Statistics are read from PostgreSQL.

## License

ISC
