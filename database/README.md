# Fleetify Database Toolkit

This folder packages everything required to run Fleetify's PostgreSQL instance locally or inside CI. It contains a custom Docker image, schema/seed SQL, and a tiny Python CLI for provisioning.

## Contents

| File/Folder | Purpose |
|-------------|---------|
| `Dockerfile` | Builds a Postgres 18 image that auto-loads the schema on first boot (with default ENV credentials). |
| `manage.py` | Command-line helper to create/reset the database or inspect table status. |
| `requirements.txt` | Dependencies for the helper CLI (`psycopg2-binary`, `python-dotenv`). |
| `sql/*.sql` | Ordered schema + seed scripts consumed by Postgres and the CLI. |

## Quick start

1. **Build the image**

   ```powershell
   docker build -t fleetify-postgres database
   ```

2. **Configure credentials**

   Edit `database/.env` to set `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` (defaults are provided).

3. **Run the container**

   ```powershell
   docker run --name fleetify-db `
     --env-file database/.env `
     -p 5432:5432 -d fleetify-postgres
   ```

   The first boot will execute every `sql/*.sql` file in lexical order (schema first, seed last).

4. **Wire into `docker-compose.yaml`** (optional)

   ```yaml
   db:
     build: ./database
     env_file:
       - database/.env
     ports:
       - "5432:5432"
     volumes:
       - db_data:/var/lib/postgresql/data
   ```

> **Password changes?** Remove the volume so Postgres can re-read the new ENV values:
> ```powershell
> docker compose down db
> docker volume rm fleetify_db_data
> docker compose up -d db
> ```

## Using the CLI

Install dependencies (ideally in a virtualenv):

```powershell
cd database
pip install -r requirements.txt
```

### Initialize the schema

```powershell
python manage.py init --create --seed --dsn postgresql://fleetify:fleetify_password@localhost:5432/fleetify_core
```

- `--create` asks the script to create the database if it does not yet exist.
- `--seed` runs `900_seed_data.sql` after schema creation.
- The DSN falls back to `DATABASE_URL` or the local default shown above.

### Check current tables

```powershell
python manage.py status --dsn postgresql://fleetify:fleetify_password@localhost:5432/fleetify_core
```

### Drop and rebuild everything

```powershell
python manage.py reset --dsn postgresql://fleetify:fleetify_password@localhost:5432/fleetify_core
```

## Schema overview

- `users`, `user_sessions`: Auth microservice stores identities and refresh tokens.
- `vehicles`, `vehicle_metrics`: Analytics service aggregates fleet KPIs for dashboards.
- `notification_channels`, `notifications`, `notification_preferences`: Notification microservice persists outbound events and preferences.

Adjust or extend the SQL scripts as new microservices are added; just keep numbering consistent so files run in the intended order.
