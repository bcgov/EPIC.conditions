-- Create schema
CREATE SCHEMA IF NOT EXISTS condition;

-- Create tables within the schema
CREATE SEQUENCE IF NOT EXISTS conditions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
	
CREATE OR REPLACE FUNCTION condition.update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
	
-- Table: public.projects

-- DROP TABLE IF EXISTS public.projects;

CREATE TABLE IF NOT EXISTS condition.projects
(
    id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    project_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
	project_name text COLLATE pg_catalog."default",
    document_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    display_name text COLLATE pg_catalog."default",
    document_file_name text COLLATE pg_catalog."default",
    date_issued date,
    act integer,
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_project_id_document_id_key UNIQUE (project_id, document_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS condition.projects
    OWNER to condition;

-- Trigger: update_projects_updated_date

-- DROP TRIGGER IF EXISTS update_projects_updated_date ON condition.projects;

CREATE TRIGGER update_projects_updated_date
    BEFORE UPDATE 
    ON condition.projects
    FOR EACH ROW
    EXECUTE FUNCTION condition.update_updated_date();
	
-- Table: public.conditions

-- DROP TABLE IF EXISTS public.conditions;

CREATE TABLE IF NOT EXISTS condition.conditions
(
    id integer NOT NULL DEFAULT nextval('conditions_id_seq'::regclass),
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    project_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    document_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    condition_name text COLLATE pg_catalog."default",
    condition_number integer,
    condition_text text COLLATE pg_catalog."default",
    topic_tags text[] COLLATE pg_catalog."default",
    subtopic_tags text[] COLLATE pg_catalog."default",
	is_approved boolean,  
    CONSTRAINT conditions_pkey PRIMARY KEY (id),
    CONSTRAINT conditions_project_id_document_id_fkey FOREIGN KEY (document_id, project_id)
        REFERENCES condition.projects (document_id, project_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS condition.conditions
    OWNER to condition;

-- Trigger: update_conditions_updated_date

-- DROP TRIGGER IF EXISTS update_conditions_updated_date ON public.conditions;

CREATE TRIGGER update_conditions_updated_date
    BEFORE UPDATE 
    ON condition.conditions
    FOR EACH ROW
    EXECUTE FUNCTION condition.update_updated_date();
