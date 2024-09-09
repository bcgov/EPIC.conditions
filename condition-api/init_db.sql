-- Create the schema
CREATE SCHEMA IF NOT EXISTS condition;

-- Create the user role
CREATE ROLE condition WITH LOGIN PASSWORD 'condition';

-- Grant privileges
GRANT USAGE ON SCHEMA condition TO condition;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP ON ALL TABLES IN SCHEMA condition TO condition;
