-- Seed lokálního PG: vytvoří demo tenant DB, kterou bude používat data-plane.
-- Control-plane DB se vytvoří přes POSTGRES_DB env proměnnou v docker-compose.
-- V produkci provisionování tenantích DB řídí Terraform + application code.

SELECT 'CREATE DATABASE p4spc_tenant_demo'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'p4spc_tenant_demo')\gexec
