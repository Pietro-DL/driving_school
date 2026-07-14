# alembic/env.py
"""
Alembic environment configuration for async SQLAlchemy + asyncpg.

Key decisions:
  - Uses run_async_migrations() to support the async engine from db/session.py.
  - Reads DATABASE_URL from app.core.config.settings (which reads from .env).
  - target_metadata points to Base.metadata so autogenerate works.
  - The synchronous URL (postgresql+psycopg2 or psycopg) is NOT used here;
    we keep asyncpg but wrap it in asyncio.run() for the migration runner.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------------------------
# App imports — must be importable from the backend/ working directory
# ---------------------------------------------------------------------------
from app.core.config import settings
from app.db.base_class import Base

# Import all models so their tables are registered on Base.metadata
from app.models.user_model import User  # noqa: F401

# ---------------------------------------------------------------------------
# Alembic config object
# ---------------------------------------------------------------------------
config = context.config

# Configure Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point to our models so autogenerate detects schema changes
target_metadata = Base.metadata

# Override the sqlalchemy.url from alembic.ini with the value from settings.
# This keeps credentials out of alembic.ini (which may be committed to git).
config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)


# ---------------------------------------------------------------------------
# Offline migrations (generates SQL without a live DB connection)
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online migrations (async engine + asyncio.run)
# ---------------------------------------------------------------------------
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations in a sync context."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # run_sync executes the synchronous do_run_migrations in the async context
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
