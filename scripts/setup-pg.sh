#!/bin/bash
# Setup PostgreSQL for StreamFinity

# Create user if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='streamfinity'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER streamfinity WITH PASSWORD 'streamfinity';"

# Create database if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='streamfinity'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE streamfinity OWNER streamfinity;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE streamfinity TO streamfinity;"
sudo -u postgres psql -d streamfinity -c "GRANT ALL ON SCHEMA public TO streamfinity;"

echo "PostgreSQL setup complete for streamfinity"

# Verify connection
PGPASSWORD=streamfinity psql -h 127.0.0.1 -U streamfinity -d streamfinity -c "SELECT version();" 2>&1 | head -3
