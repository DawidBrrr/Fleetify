#!/usr/bin/env python
"""Utility CLI for provisioning the Fleetify PostgreSQL database."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse, urlunparse

import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2.extras import DictCursor

try:  # pragma: no cover - optional helper
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional helper
    load_dotenv = None

ROOT = Path(__file__).parent
SQL_DIR = ROOT / "sql"
DEFAULT_DSN = "postgresql://fleetify:fleetify_password@localhost:5432/fleetify_core"


def load_env() -> None:
    """Load an optional .env file placed next to this script."""
    if load_dotenv is None:
        return
    env_path = ROOT / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def resolve_dsn(cli_value: str | None) -> str:
    """Prefer CLI DSN, then DATABASE_URL env, then a helpful default."""
    return cli_value or os.getenv("DATABASE_URL") or DEFAULT_DSN


def _parsed_dsn(dsn: str):
    parsed = urlparse(dsn)
    if not parsed.path or parsed.path == "/":
        raise ValueError("Database name missing from DSN")
    return parsed


def database_exists(dsn: str) -> bool:
    try:
        with psycopg2.connect(dsn):
            return True
    except psycopg2.OperationalError:
        return False


def create_database_if_needed(dsn: str) -> None:
    parsed = _parsed_dsn(dsn)
    db_name = parsed.path.lstrip("/")
    admin_dsn = urlunparse(parsed._replace(path="/postgres"))
    conn = psycopg2.connect(admin_dsn)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (db_name,))
        if cur.fetchone():
            return
        cur.execute(sql.SQL("CREATE DATABASE {}" ).format(sql.Identifier(db_name)))
    conn.close()


def iter_sql_files(include_seed: bool) -> Iterable[Path]:
    files = sorted(SQL_DIR.glob("[0-9][0-9][0-9]_*.sql"))
    if include_seed:
        return files
    return [path for path in files if not path.name.startswith("900_")]


def apply_sql_files(dsn: str, include_seed: bool) -> list[str]:
    applied: list[str] = []
    files = list(iter_sql_files(include_seed))
    if not files:
        return applied
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            for path in files:
                statement = path.read_text(encoding="utf-8")
                if not statement.strip():
                    continue
                cur.execute(statement)
                applied.append(path.name)
        conn.commit()
    return applied


def show_status(dsn: str) -> list[tuple[str, int]]:
    query = """
        SELECT tab.table_name,
               COALESCE(stat.reltuples::bigint, 0) AS approx_rows
        FROM information_schema.tables tab
        LEFT JOIN pg_class stat
               ON stat.relname = tab.table_name
        WHERE tab.table_schema = 'public'
        ORDER BY tab.table_name;
    """
    with psycopg2.connect(dsn, cursor_factory=DictCursor) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return [(row["table_name"], int(row["approx_rows"])) for row in cur.fetchall()]


def drop_database(dsn: str) -> None:
    parsed = _parsed_dsn(dsn)
    db_name = parsed.path.lstrip("/")
    admin_dsn = urlunparse(parsed._replace(path="/postgres"))
    conn = psycopg2.connect(admin_dsn)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn.cursor() as cur:
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=%s", (db_name,))
        cur.execute(sql.SQL("DROP DATABASE IF EXISTS {}" ).format(sql.Identifier(db_name)))
    conn.close()


def handle_init(args: argparse.Namespace) -> None:
    dsn = resolve_dsn(args.dsn)
    if args.create:
        create_database_if_needed(dsn)
    elif not database_exists(dsn):
        print("Database does not exist. Use --create to bootstrap it.", file=sys.stderr)
        sys.exit(1)
    applied = apply_sql_files(dsn, include_seed=args.seed)
    print("Applied:" if applied else "No SQL files applied.")
    for name in applied:
        print(f"  - {name}")


def handle_status(args: argparse.Namespace) -> None:
    dsn = resolve_dsn(args.dsn)
    if not database_exists(dsn):
        print("Database unreachable. Check DSN or run init first.", file=sys.stderr)
        sys.exit(1)
    rows = show_status(dsn)
    if not rows:
        print("No tables found.")
        return
    print("Current tables:")
    for name, count in rows:
        print(f"  - {name}: ~{count} rows")


def handle_reset(args: argparse.Namespace) -> None:
    dsn = resolve_dsn(args.dsn)
    drop_database(dsn)
    create_database_if_needed(dsn)
    applied = apply_sql_files(dsn, include_seed=True)
    print("Reset database. Applied:")
    for name in applied:
        print(f"  - {name}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dsn", help="PostgreSQL DSN, defaults to DATABASE_URL or local dev DSN")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_cmd = subparsers.add_parser("init", help="Create schema (optionally seed data)")
    init_cmd.add_argument("--seed", action="store_true", help="Execute seed*.sql files after schema")
    init_cmd.add_argument("--create", action="store_true", help="Create the database if it does not exist")
    init_cmd.set_defaults(func=handle_init)

    status_cmd = subparsers.add_parser("status", help="List tables and approximate row counts")
    status_cmd.set_defaults(func=handle_status)

    reset_cmd = subparsers.add_parser("reset", help="Drop, recreate, and seed the database")
    reset_cmd.set_defaults(func=handle_reset)

    return parser


def main(argv: list[str] | None = None) -> int:
    load_env()
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

