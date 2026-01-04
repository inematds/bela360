-- ===========================================
-- bela360 - PostgreSQL Initialization Script
-- ===========================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create schema for Evolution API
CREATE SCHEMA IF NOT EXISTS evolution;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO bela360;
GRANT ALL PRIVILEGES ON SCHEMA evolution TO bela360;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'bela360 database initialized successfully!';
END $$;
