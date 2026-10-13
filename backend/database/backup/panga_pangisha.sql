--
-- PostgreSQL database dump
--

\restrict NrZ7AFYNr0hwKm0xpJPPRgE4FNzDjz4EFqMwoPvvicvdZI6qBitTDImmyX11Aow

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.viewing_requests DROP CONSTRAINT IF EXISTS viewing_requests_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.viewing_requests DROP CONSTRAINT IF EXISTS viewing_requests_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.units DROP CONSTRAINT IF EXISTS units_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.tenancies DROP CONSTRAINT IF EXISTS tenancies_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.tenancies DROP CONSTRAINT IF EXISTS tenancies_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.rent_payments DROP CONSTRAINT IF EXISTS rent_payments_tenancy_id_foreign;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_tenancy_id_foreign;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.listing_reports DROP CONSTRAINT IF EXISTS listing_reports_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.listing_reports DROP CONSTRAINT IF EXISTS listing_reports_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.identity_verifications DROP CONSTRAINT IF EXISTS identity_verifications_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.identity_verifications DROP CONSTRAINT IF EXISTS identity_verifications_reviewed_by_foreign;
ALTER TABLE IF EXISTS ONLY public.houses DROP CONSTRAINT IF EXISTS houses_owner_id_foreign;
ALTER TABLE IF EXISTS ONLY public.house_images DROP CONSTRAINT IF EXISTS house_images_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.favorites DROP CONSTRAINT IF EXISTS favorites_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_user_low_id_foreign;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_user_high_id_foreign;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_house_id_foreign;
ALTER TABLE IF EXISTS ONLY public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_reviewed_by_foreign;
ALTER TABLE IF EXISTS ONLY public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_admin_id_foreign;
DROP INDEX IF EXISTS public.users_country_index;
DROP INDEX IF EXISTS public.tenancies_status_index;
DROP INDEX IF EXISTS public.rent_payments_paid_on_index;
DROP INDEX IF EXISTS public.personal_access_tokens_tokenable_type_tokenable_id_index;
DROP INDEX IF EXISTS public.personal_access_tokens_expires_at_index;
DROP INDEX IF EXISTS public.participant_updated_at_index;
DROP INDEX IF EXISTS public.participant_index;
DROP INDEX IF EXISTS public.notifications_notifiable_type_notifiable_id_index;
DROP INDEX IF EXISTS public.maintenance_requests_status_index;
DROP INDEX IF EXISTS public.jobs_queue_index;
DROP INDEX IF EXISTS public.identity_verifications_status_index;
DROP INDEX IF EXISTS public.houses_status_index;
DROP INDEX IF EXISTS public.houses_property_type_index;
DROP INDEX IF EXISTS public.houses_district_index;
DROP INDEX IF EXISTS public.failed_jobs_connection_queue_failed_at_index;
DROP INDEX IF EXISTS public.conversation_index;
DROP INDEX IF EXISTS public.cache_locks_expiration_index;
DROP INDEX IF EXISTS public.cache_expiration_index;
DROP INDEX IF EXISTS public.business_profiles_status_index;
DROP INDEX IF EXISTS public.ai_usage_logs_status_index;
DROP INDEX IF EXISTS public.ai_usage_logs_feature_index;
DROP INDEX IF EXISTS public.ai_usage_logs_created_at_index;
DROP INDEX IF EXISTS public.agent_conversation_messages_conversation_id_index;
DROP INDEX IF EXISTS public.admin_actions_subject_type_subject_id_index;
ALTER TABLE IF EXISTS ONLY public.viewing_requests DROP CONSTRAINT IF EXISTS viewing_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_uuid_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_phone_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.units DROP CONSTRAINT IF EXISTS units_pkey;
ALTER TABLE IF EXISTS ONLY public.units DROP CONSTRAINT IF EXISTS units_house_id_unit_number_unique;
ALTER TABLE IF EXISTS ONLY public.tenancies DROP CONSTRAINT IF EXISTS tenancies_pkey;
ALTER TABLE IF EXISTS ONLY public.rent_payments DROP CONSTRAINT IF EXISTS rent_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.listing_reports DROP CONSTRAINT IF EXISTS listing_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_batches DROP CONSTRAINT IF EXISTS job_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.identity_verifications DROP CONSTRAINT IF EXISTS identity_verifications_pkey;
ALTER TABLE IF EXISTS ONLY public.houses DROP CONSTRAINT IF EXISTS houses_pkey;
ALTER TABLE IF EXISTS ONLY public.house_images DROP CONSTRAINT IF EXISTS house_images_pkey;
ALTER TABLE IF EXISTS ONLY public.favorites DROP CONSTRAINT IF EXISTS favorites_pkey;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_uuid_unique;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_user_low_id_user_high_id_unique;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.cache DROP CONSTRAINT IF EXISTS cache_pkey;
ALTER TABLE IF EXISTS ONLY public.cache_locks DROP CONSTRAINT IF EXISTS cache_locks_pkey;
ALTER TABLE IF EXISTS ONLY public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_settings DROP CONSTRAINT IF EXISTS ai_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_conversations DROP CONSTRAINT IF EXISTS agent_conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_conversation_messages DROP CONSTRAINT IF EXISTS agent_conversation_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_pkey;
ALTER TABLE IF EXISTS public.viewing_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.units ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tenancies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rent_payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.personal_access_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.maintenance_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.listing_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.identity_verifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.houses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.house_images ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.failed_jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.device_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.conversations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_usage_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_actions ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.viewing_requests_id_seq;
DROP TABLE IF EXISTS public.viewing_requests;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.units_id_seq;
DROP TABLE IF EXISTS public.units;
DROP SEQUENCE IF EXISTS public.tenancies_id_seq;
DROP TABLE IF EXISTS public.tenancies;
DROP SEQUENCE IF EXISTS public.rent_payments_id_seq;
DROP TABLE IF EXISTS public.rent_payments;
DROP SEQUENCE IF EXISTS public.profiles_id_seq;
DROP TABLE IF EXISTS public.profiles;
DROP SEQUENCE IF EXISTS public.personal_access_tokens_id_seq;
DROP TABLE IF EXISTS public.personal_access_tokens;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP SEQUENCE IF EXISTS public.maintenance_requests_id_seq;
DROP TABLE IF EXISTS public.maintenance_requests;
DROP SEQUENCE IF EXISTS public.listing_reports_id_seq;
DROP TABLE IF EXISTS public.listing_reports;
DROP SEQUENCE IF EXISTS public.jobs_id_seq;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.job_batches;
DROP SEQUENCE IF EXISTS public.identity_verifications_id_seq;
DROP TABLE IF EXISTS public.identity_verifications;
DROP SEQUENCE IF EXISTS public.houses_id_seq;
DROP TABLE IF EXISTS public.houses;
DROP SEQUENCE IF EXISTS public.house_images_id_seq;
DROP TABLE IF EXISTS public.house_images;
DROP TABLE IF EXISTS public.favorites;
DROP SEQUENCE IF EXISTS public.failed_jobs_id_seq;
DROP TABLE IF EXISTS public.failed_jobs;
DROP SEQUENCE IF EXISTS public.device_tokens_id_seq;
DROP TABLE IF EXISTS public.device_tokens;
DROP SEQUENCE IF EXISTS public.conversations_id_seq;
DROP TABLE IF EXISTS public.conversations;
DROP TABLE IF EXISTS public.cache_locks;
DROP TABLE IF EXISTS public.cache;
DROP SEQUENCE IF EXISTS public.business_profiles_id_seq;
DROP TABLE IF EXISTS public.business_profiles;
DROP SEQUENCE IF EXISTS public.ai_usage_logs_id_seq;
DROP TABLE IF EXISTS public.ai_usage_logs;
DROP SEQUENCE IF EXISTS public.ai_settings_id_seq;
DROP TABLE IF EXISTS public.ai_settings;
DROP TABLE IF EXISTS public.agent_conversations;
DROP TABLE IF EXISTS public.agent_conversation_messages;
DROP SEQUENCE IF EXISTS public.admin_actions_id_seq;
DROP TABLE IF EXISTS public.admin_actions;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.admin_actions (
    id bigint NOT NULL,
    admin_id bigint,
    action character varying(255) NOT NULL,
    subject_type character varying(255) NOT NULL,
    subject_id bigint NOT NULL,
    summary character varying(255) NOT NULL,
    created_at timestamp(0) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_actions OWNER TO panga;

--
-- Name: admin_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.admin_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_actions_id_seq OWNER TO panga;

--
-- Name: admin_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.admin_actions_id_seq OWNED BY public.admin_actions.id;


--
-- Name: agent_conversation_messages; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.agent_conversation_messages (
    id character varying(36) NOT NULL,
    conversation_id character varying(36) NOT NULL,
    participant_type character varying(255),
    participant_id bigint,
    agent character varying(255) NOT NULL,
    role character varying(25) NOT NULL,
    content text NOT NULL,
    attachments text NOT NULL,
    steps text NOT NULL,
    usage text NOT NULL,
    meta text NOT NULL,
    status character varying(25) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.agent_conversation_messages OWNER TO panga;

--
-- Name: agent_conversations; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.agent_conversations (
    id character varying(36) NOT NULL,
    participant_type character varying(255),
    participant_id bigint,
    title character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.agent_conversations OWNER TO panga;

--
-- Name: ai_settings; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.ai_settings (
    id bigint NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    provider character varying(40) DEFAULT 'gemini'::character varying NOT NULL,
    model character varying(120),
    timeout_seconds smallint DEFAULT '30'::smallint NOT NULL,
    rate_per_minute smallint DEFAULT '10'::smallint NOT NULL,
    user_daily_tokens integer DEFAULT 50000 NOT NULL,
    global_daily_tokens bigint DEFAULT '2000000'::bigint NOT NULL,
    global_monthly_tokens bigint DEFAULT '40000000'::bigint NOT NULL,
    monthly_cost_cap numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    input_price_per_million numeric(10,4) DEFAULT '0'::numeric NOT NULL,
    output_price_per_million numeric(10,4) DEFAULT '0'::numeric NOT NULL,
    alert_percent smallint DEFAULT '80'::smallint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.ai_settings OWNER TO panga;

--
-- Name: ai_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.ai_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_settings_id_seq OWNER TO panga;

--
-- Name: ai_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.ai_settings_id_seq OWNED BY public.ai_settings.id;


--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.ai_usage_logs (
    id bigint NOT NULL,
    user_id bigint,
    feature character varying(60) NOT NULL,
    provider character varying(40) NOT NULL,
    model character varying(120),
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cost numeric(12,6) DEFAULT '0'::numeric NOT NULL,
    latency_ms integer DEFAULT 0 NOT NULL,
    status character varying(20) NOT NULL,
    error character varying(500),
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ai_usage_logs OWNER TO panga;

--
-- Name: ai_usage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.ai_usage_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_usage_logs_id_seq OWNER TO panga;

--
-- Name: ai_usage_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.ai_usage_logs_id_seq OWNED BY public.ai_usage_logs.id;


--
-- Name: business_profiles; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.business_profiles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    entity_name character varying(255) NOT NULL,
    business_type character varying(60) NOT NULL,
    tin character varying(9) NOT NULL,
    brela character varying(50),
    vrn character varying(50),
    phone character varying(30),
    email character varying(255),
    address character varying(255),
    website character varying(255),
    bio text,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    rejection_reason character varying(500),
    reviewed_by bigint,
    reviewed_at timestamp(0) with time zone,
    submitted_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.business_profiles OWNER TO panga;

--
-- Name: business_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.business_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_profiles_id_seq OWNER TO panga;

--
-- Name: business_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.business_profiles_id_seq OWNED BY public.business_profiles.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO panga;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO panga;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    user_low_id bigint NOT NULL,
    user_high_id bigint NOT NULL,
    house_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.conversations OWNER TO panga;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO panga;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.device_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token character varying(255) NOT NULL,
    platform character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.device_tokens OWNER TO panga;

--
-- Name: device_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.device_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_tokens_id_seq OWNER TO panga;

--
-- Name: device_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.device_tokens_id_seq OWNED BY public.device_tokens.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO panga;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO panga;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.favorites (
    user_id bigint NOT NULL,
    house_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.favorites OWNER TO panga;

--
-- Name: house_images; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.house_images (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    path character varying(255) NOT NULL,
    caption character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.house_images OWNER TO panga;

--
-- Name: house_images_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.house_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.house_images_id_seq OWNER TO panga;

--
-- Name: house_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.house_images_id_seq OWNED BY public.house_images.id;


--
-- Name: houses; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.houses (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    property_name character varying(255),
    property_type character varying(255),
    property_category character varying(255),
    furnishing_status character varying(255),
    description text,
    region character varying(255),
    district character varying(255),
    ward character varying(255),
    street character varying(255),
    house_number character varying(255),
    landmark character varying(255),
    bedrooms integer,
    bathrooms integer,
    square_feet integer,
    monthly_rent numeric(12,2),
    security_deposit numeric(12,2),
    maintenance_fee numeric(12,2),
    amenities json,
    contact_name character varying(255),
    contact_phone character varying(255),
    contact_email character varying(255),
    lease_duration character varying(255),
    cover_image character varying(255),
    status character varying(255) DEFAULT 'available'::character varying NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    advertiser_role character varying(255) DEFAULT 'owner'::character varying NOT NULL,
    verified_at timestamp(0) with time zone,
    availability_confirmed_at timestamp(0) with time zone,
    napa_number character varying(50)
);


ALTER TABLE public.houses OWNER TO panga;

--
-- Name: houses_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.houses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.houses_id_seq OWNER TO panga;

--
-- Name: houses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.houses_id_seq OWNED BY public.houses.id;


--
-- Name: identity_verifications; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.identity_verifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    method character varying(255) NOT NULL,
    nida_number text,
    document_path character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    rejection_reason character varying(500),
    reviewed_by bigint,
    reviewed_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.identity_verifications OWNER TO panga;

--
-- Name: identity_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.identity_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.identity_verifications_id_seq OWNER TO panga;

--
-- Name: identity_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.identity_verifications_id_seq OWNED BY public.identity_verifications.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO panga;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO panga;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO panga;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: listing_reports; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.listing_reports (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    user_id bigint NOT NULL,
    reason character varying(255) NOT NULL,
    details character varying(1000),
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.listing_reports OWNER TO panga;

--
-- Name: listing_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.listing_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listing_reports_id_seq OWNER TO panga;

--
-- Name: listing_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.listing_reports_id_seq OWNED BY public.listing_reports.id;


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.maintenance_requests (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    tenancy_id bigint,
    title character varying(120) NOT NULL,
    details text,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.maintenance_requests OWNER TO panga;

--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.maintenance_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_requests_id_seq OWNER TO panga;

--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.maintenance_requests_id_seq OWNED BY public.maintenance_requests.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO panga;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO panga;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    notifiable_type character varying(255) NOT NULL,
    notifiable_id bigint NOT NULL,
    data text NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.notifications OWNER TO panga;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO panga;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO panga;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.profiles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    profile_image character varying(255),
    bio text,
    location character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.profiles OWNER TO panga;

--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profiles_id_seq OWNER TO panga;

--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: rent_payments; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.rent_payments (
    id bigint NOT NULL,
    tenancy_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_on date NOT NULL,
    method character varying(20),
    note character varying(300),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.rent_payments OWNER TO panga;

--
-- Name: rent_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.rent_payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rent_payments_id_seq OWNER TO panga;

--
-- Name: rent_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.rent_payments_id_seq OWNED BY public.rent_payments.id;


--
-- Name: tenancies; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.tenancies (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    user_id bigint,
    name character varying(120) NOT NULL,
    phone character varying(30),
    email character varying(190),
    unit character varying(30),
    monthly_rent numeric(12,2) NOT NULL,
    starts_on date NOT NULL,
    ends_on date,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.tenancies OWNER TO panga;

--
-- Name: tenancies_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.tenancies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenancies_id_seq OWNER TO panga;

--
-- Name: tenancies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.tenancies_id_seq OWNED BY public.tenancies.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.units (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    unit_number character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'available'::character varying NOT NULL,
    monthly_rent numeric(12,2),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    unit_type character varying(100),
    payment_terms character varying(100),
    bedrooms integer DEFAULT 1 NOT NULL,
    bathrooms integer DEFAULT 1 NOT NULL,
    image_path character varying(255),
    description text
);


ALTER TABLE public.units OWNER TO panga;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO panga;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    uuid uuid NOT NULL,
    fullname character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    role character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    suspended_at timestamp(0) with time zone,
    country character varying(2)
);


ALTER TABLE public.users OWNER TO panga;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO panga;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: viewing_requests; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.viewing_requests (
    id bigint NOT NULL,
    house_id bigint NOT NULL,
    user_id bigint NOT NULL,
    preferred_at timestamp(0) with time zone NOT NULL,
    note character varying(500),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.viewing_requests OWNER TO panga;

--
-- Name: viewing_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.viewing_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.viewing_requests_id_seq OWNER TO panga;

--
-- Name: viewing_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.viewing_requests_id_seq OWNED BY public.viewing_requests.id;


--
-- Name: admin_actions id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.admin_actions ALTER COLUMN id SET DEFAULT nextval('public.admin_actions_id_seq'::regclass);


--
-- Name: ai_settings id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.ai_settings ALTER COLUMN id SET DEFAULT nextval('public.ai_settings_id_seq'::regclass);


--
-- Name: ai_usage_logs id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.ai_usage_logs ALTER COLUMN id SET DEFAULT nextval('public.ai_usage_logs_id_seq'::regclass);


--
-- Name: business_profiles id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.business_profiles ALTER COLUMN id SET DEFAULT nextval('public.business_profiles_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: device_tokens id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.device_tokens ALTER COLUMN id SET DEFAULT nextval('public.device_tokens_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: house_images id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.house_images ALTER COLUMN id SET DEFAULT nextval('public.house_images_id_seq'::regclass);


--
-- Name: houses id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.houses ALTER COLUMN id SET DEFAULT nextval('public.houses_id_seq'::regclass);


--
-- Name: identity_verifications id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.identity_verifications ALTER COLUMN id SET DEFAULT nextval('public.identity_verifications_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: listing_reports id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.listing_reports ALTER COLUMN id SET DEFAULT nextval('public.listing_reports_id_seq'::regclass);


--
-- Name: maintenance_requests id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.maintenance_requests ALTER COLUMN id SET DEFAULT nextval('public.maintenance_requests_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: rent_payments id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.rent_payments ALTER COLUMN id SET DEFAULT nextval('public.rent_payments_id_seq'::regclass);


--
-- Name: tenancies id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.tenancies ALTER COLUMN id SET DEFAULT nextval('public.tenancies_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: viewing_requests id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.viewing_requests ALTER COLUMN id SET DEFAULT nextval('public.viewing_requests_id_seq'::regclass);


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.admin_actions (id, admin_id, action, subject_type, subject_id, summary, created_at) FROM stdin;
7	8	user.suspended	user	15	Suspended Baraka Mrema	2026-10-13 09:32:21+00
8	8	user.reactivated	user	15	Reactivated Baraka Mrema	2026-10-13 09:32:22+00
9	8	listing.verified	listing	15	Verified “Self-contained room, Sinza Mori”	2026-10-13 09:32:26+00
10	8	report.resolved	report	2	Marked report #2 on listing #20 as resolved	2026-10-13 09:32:28+00
11	8	listing.suspended	listing	13	Suspended “Sea-breeze villa near Coco Beach”	2026-10-13 09:48:30+00
12	8	listing.restored	listing	13	Restored “Sea-breeze villa near Coco Beach”	2026-10-13 09:48:31+00
13	8	identity.rejected	identity	3	Rejected the identity of Salma Omari	2026-10-13 10:11:58+00
14	8	identity.approved	identity	4	Approved the identity of Salma Omari	2026-10-13 10:12:43+00
15	8	identity.approved	identity	5	Approved the identity of ibrahim kimaro	2026-10-13 11:07:34+00
16	8	announcement.sent	announcement	8	Sent “Welcome to Panga” to 4 landlords: Thank you for joining. Add your first home from the Properties tab.	2026-10-13 11:32:54+00
17	8	user.exported	user	8	Downloaded the user list as a spreadsheet	2026-10-13 11:32:58+00
18	8	user.exported	user	8	Downloaded the user list as a spreadsheet	2026-10-13 11:49:27+00
19	8	listing.verified	listing	19	Verified “New two-bedroom house, Kigamboni”	2026-10-13 11:51:17+00
20	8	business.approved	business	1	Approved the business “Hassan Property Agents” of Juma Hassan	2026-10-13 12:02:18+00
21	8	business.rejected	business	2	Rejected the business “Mushi Homes Ltd” of Neema Mushi	2026-10-13 12:06:15+00
22	8	user.messaged	user	14	Sent “Add your business details” to Amina Said: Open Account, then Business Information, and send your business details so we can verify your business.	2026-10-13 12:14:33+00
23	8	user.messaged	user	18	Sent “BUSINESS VERIFICATION” to ibrahim kimaro: we genunly inform you ibrahim to cover your business details	2026-10-13 12:20:14+00
24	8	user.messaged	user	18	Sent “Add your business details” to ibrahim kimaro: Open Account, then Business Information, and send your business details so we can verify your business.	2026-10-13 12:54:30+00
25	8	identity.approved	identity	6	Approved the identity of tamimu	2026-10-13 13:16:44+00
26	8	listing.verified	listing	20	Verified “Single room near Mwenge bus stand”	2026-10-13 13:28:49+00
27	8	identity.revoked	identity	6	Revoked the verified identity of tamimu	2026-10-13 13:29:48+00
28	8	identity.revoked	identity	5	Revoked the verified identity of ibrahim kimaro	2026-10-13 13:29:59+00
29	8	identity.approved	identity	7	Approved the identity of ibrahim kimaro	2026-10-13 13:51:45+00
30	8	listing.verified	listing	23	Verified “Kimaro Modern Residence”	2026-10-13 14:35:35+00
31	8	listing.unverified	listing	23	Unverified “Kimaro Modern Residence”	2026-10-13 14:51:03+00
32	\N	listing.verified	listing	23	Verified “Kimaro Modern Residence”	2026-10-13 14:52:50+00
33	8	listing.verified	listing	23	Verified “Kimaro Modern Residence”	2026-10-13 14:53:34+00
34	8	ai.updated	ai	2	Changed AI settings: gemini / emini-3.1-flash-lite	2026-10-13 15:56:27+00
35	8	ai.updated	ai	2	Changed AI settings: gemini / emini-3.1-flash-lite	2026-10-13 15:56:30+00
36	8	ai.updated	ai	2	Changed AI settings: gemini / gemini-3.1-flash-lite	2026-10-13 15:56:56+00
\.


--
-- Data for Name: agent_conversation_messages; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.agent_conversation_messages (id, conversation_id, participant_type, participant_id, agent, role, content, attachments, steps, usage, meta, status, created_at, updated_at) FROM stdin;
01a13608-86d3-7382-adb1-048d96bcf11e	01a13607-9ba8-7128-9d77-aba4646af6e0	App\\Models\\User	12	App\\Ai\\Agents\\VeyoraAssistant	user	Which properties do I currently have in my portfolio?	[]	[]	[]	[]	completed	2026-10-13 16:11:30	2026-10-13 16:11:30
01a13608-8734-736b-a206-26a28e02829b	01a13607-9ba8-7128-9d77-aba4646af6e0	App\\Models\\User	12	App\\Ai\\Agents\\VeyoraAssistant	assistant		[]	[{"content":"","tool_calls":[{"id":"call_131508","name":"list_my_properties","arguments":[],"result_id":"call_131508","thought_signature":"EnMKcQFpFH0Tv\\/O2UT2nz3M9Ivqco8WWmTaSu1CcLvVC6VBYl77AOYQcFaXBOI8RtCpkKHmkoB+BZhrmUGDEsQdIIEz8cNzK6JrgurPapj\\/CflyifuvS1cUz8CAi7I8t1budybrG8VK9R1h1PuD16sCDuCRL","result":"{\\n    \\"count\\": 6,\\n    \\"properties\\": [\\n        {\\n            \\"id\\": 22,\\n            \\"property_name\\": \\"Garden cottage, Kinondoni Makumbusho\\",\\n            \\"property_type\\": \\"House\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Kinondoni\\",\\n            \\"ward\\": \\"Makumbusho\\",\\n            \\"street\\": \\"Kajenge Road\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 600000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        },\\n        {\\n            \\"id\\": 21,\\n            \\"property_name\\": \\"Modern townhouse, Tabata Segerea\\",\\n            \\"property_type\\": \\"House\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Ilala\\",\\n            \\"ward\\": \\"Tabata\\",\\n            \\"street\\": \\"Segerea Road\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 750000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        },\\n        {\\n            \\"id\\": 19,\\n            \\"property_name\\": \\"New two-bedroom house, Kigamboni\\",\\n            \\"property_type\\": \\"House\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Kigamboni\\",\\n            \\"ward\\": \\"Kibada\\",\\n            \\"street\\": \\"Kibada Road\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 400000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        },\\n        {\\n            \\"id\\": 17,\\n            \\"property_name\\": \\"Studio in Upanga, walk to town\\",\\n            \\"property_type\\": \\"Studio\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Ilala\\",\\n            \\"ward\\": \\"Upanga\\",\\n            \\"street\\": \\"Mindu Street\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 520000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        },\\n        {\\n            \\"id\\": 14,\\n            \\"property_name\\": \\"Two-bedroom flat, Mikocheni B\\",\\n            \\"property_type\\": \\"Apartment\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Kinondoni\\",\\n            \\"ward\\": \\"Mikocheni\\",\\n            \\"street\\": \\"Rose Garden Road\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 850000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        },\\n        {\\n            \\"id\\": 13,\\n            \\"property_name\\": \\"Sea-breeze villa near Coco Beach\\",\\n            \\"property_type\\": \\"House\\",\\n            \\"status\\": \\"available\\",\\n            \\"district\\": \\"Kinondoni\\",\\n            \\"ward\\": \\"Oysterbay\\",\\n            \\"street\\": \\"Toure Drive\\",\\n            \\"napa_number\\": null,\\n            \\"monthly_rent\\": 3200000,\\n            \\"currency\\": \\"TZS\\",\\n            \\"verified\\": true,\\n            \\"units_count\\": 1,\\n            \\"vacant_units_count\\": 0\\n        }\\n    ]\\n}"}],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":1929,"output_tokens":12,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite","citations":[],"error":"AI provider [gemini] is overloaded."}	failed	2026-10-13 16:11:30	2026-10-13 16:11:30
01a13608-ca07-70a3-bb73-6d16fe3e3dd3	01a13608-c9c8-7018-b92e-b6d14ec237b3	App\\Models\\User	12	App\\Ai\\Agents\\VeyoraAssistant	user	Which properties do I currently have in my portfolio?	[]	[]	[]	[]	completed	2026-10-13 16:11:48	2026-10-13 16:11:48
01a13608-ca49-712c-a984-056a5034a154	01a13608-c9c8-7018-b92e-b6d14ec237b3	App\\Models\\User	12	App\\Ai\\Agents\\VeyoraAssistant	assistant	You currently have one property in your portfolio: Test flat located in Ilala with 5 units.	[]	[{"content":"You currently have one property in your portfolio: Test flat located in Ilala with 5 units.","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":0,"output_tokens":0,"cache_read_input_tokens":null,"cache_write_input_tokens":null,"reasoning_tokens":null}	{"provider":"gemini","model":"gemini-3.1-flash-lite","citations":[]}	completed	2026-10-13 16:11:48	2026-10-13 16:11:48
01a13613-66fe-7210-ac43-1e2a35cde2f5	01a13613-66de-73a3-b22b-d30804a92d1d	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	user	Habari Kimmy	[]	[]	[]	[]	completed	2026-10-13 16:23:23	2026-10-13 16:23:23
01a13613-6710-7144-8c6e-9d13900d2e6a	01a13613-66de-73a3-b22b-d30804a92d1d	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	assistant	Habari! Mimi ni Kimmy, msaidizi wako wa AI wa Veyora. Naweza kukusaidia kutafuta nyumba, kukagua kodi, na kusimamia wapangaji.	[]	[{"content":"Habari! Mimi ni Kimmy, msaidizi wako wa AI wa Veyora. Naweza kukusaidia kutafuta nyumba, kukagua kodi, na kusimamia wapangaji.","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":0,"output_tokens":0,"cache_read_input_tokens":null,"cache_write_input_tokens":null,"reasoning_tokens":null}	{"provider":"gemini","model":"gemini-3.1-flash-lite","citations":[]}	completed	2026-10-13 16:23:23	2026-10-13 16:23:23
17d405e4-28f6-46f0-9ed1-45c6da02eeab	a683a9a2-aa54-4f3e-ad3c-642108dbd950	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	user	hi	[]	[]	[]	[]	completed	2026-10-13 16:41:52	2026-10-13 16:41:52
01a13624-eef7-7179-a7a9-cf50798d94a0	8972e7f6-0946-4f31-927e-1a4331ea7b45	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	user	hi	[]	[]	[]	[]	completed	2026-10-13 16:42:32	2026-10-13 16:42:32
01a13624-ef0b-70ef-8279-64f5b48527b6	8972e7f6-0946-4f31-927e-1a4331ea7b45	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello Panga! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha.\n\nI am here to help you:\n• Discover verified rental houses and apartments (e.g. 'Find 2-bedroom in Masaki')\n• Review your active tenancy agreement and lease terms\n• Check your payment history and rent receipts\n• Submit maintenance requests for plumbing or electrical repairs\n\nHow can I assist you today?	[]	[]	[]	[]	completed	2026-10-13 16:42:32	2026-10-13 16:42:32
01a13625-2db3-7068-a200-c23e41a40931	7cafc8c3-9f4a-47eb-9b7a-d8ea09e45749	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	user	habari yako	[]	[]	[]	[]	completed	2026-10-13 16:42:48	2026-10-13 16:42:48
01a13625-2dba-70fa-9512-3582afe20d4b	7cafc8c3-9f4a-47eb-9b7a-d8ea09e45749	App\\Models\\User	8	App\\Ai\\Agents\\VeyoraAssistant	assistant	Habari Panga! Mimi ni Veyora, msaidizi wako rasmi wa AI wa nyumba (Panga na Kupangisha).\n\nNipo hapa kukusaidia:\n• Kutafuta vyumba na nyumba zilizothibitishwa (k.m. 'Tafuta vyumba 2 Kinondoni')\n• Kuangalia mkataba wako wa upangaji na masharti yake\n• Kuangalia historia ya malipo yako ya kodi ya pango\n• Kufungua tiketi ya marekebisho ya maji au umeme\n\nNikusaidie nini leo?	[]	[]	[]	[]	completed	2026-10-13 16:42:48	2026-10-13 16:42:48
01a13629-2526-73b4-b7be-963117e078f7	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	hi	[]	[]	[]	[]	completed	2026-10-13 16:47:08	2026-10-13 16:47:08
01a13629-2543-7013-8f7d-9aca296eaaaa	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello ibrahim! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha.\n\nAs a landlord, I can assist you with:\n• Inspecting your listed properties and tracking vacant vs occupied units\n• Reviewing your rent collection ledger and active tenants\n• Registering new properties and configuring rentable units/rooms\n• Monitoring maintenance requests across your portfolio\n\nWhat would you like to start with today?	[]	[]	[]	[]	completed	2026-10-13 16:47:08	2026-10-13 16:47:08
01a13629-7f0e-7050-b84f-830269eff8f2	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	how are you	[]	[]	[]	[]	completed	2026-10-13 16:47:31	2026-10-13 16:47:31
01a13629-7f2b-709c-8f3d-635ae521a07a	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello! I am Veyora, your official Veyora Housing AI Assistant (Panga na Kupangisha). I am doing well, thank you for asking! How can I assist you with your properties or rental management today?	[]	[{"content":"Hello! I am Veyora, your official Veyora Housing AI Assistant (Panga na Kupangisha). I am doing well, thank you for asking! How can I assist you with your properties or rental management today?","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":2434,"output_tokens":47,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite-preview","citations":[]}	completed	2026-10-13 16:47:31	2026-10-13 16:47:31
01a1362a-0ef3-7237-aa15-4d2f70ba797d	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	unanijua mimi ni nani?	[]	[]	[]	[]	completed	2026-10-13 16:48:08	2026-10-13 16:48:08
01a1362f-ca7e-7156-9d2b-431a2a68835f	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	tenancy agreement	[]	[]	[]	[]	completed	2026-10-13 16:54:24	2026-10-13 16:54:24
01a1362a-0f0b-72b3-9caa-92b12b11c9d6	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Ndiyo, ninakujua. Wewe ni Ibrahim Kimaro, na katika mfumo wetu umejisajili kama mwenye nyumba (landlord). Akaunti yako imeshathibitishwa (approved).\n\nNinaweza kukusaidia kusimamia mali zako, kuangalia wapangaji, kufuatilia malipo ya kodi, au kushughulikia maombi ya ukarabati (maintenance) kwenye nyumba zako. Je, kuna jambo lolote mahususi ungependa nikupe taarifa zake sasa hivi?	[]	[{"content":"Ndiyo, ninakujua. Wewe ni Ibrahim Kimaro, na katika mfumo wetu umejisajili kama mwenye nyumba (landlord). Akaunti yako imeshathibitishwa (approved).\\n\\nNinaweza kukusaidia kusimamia mali zako, kuangalia wapangaji, kufuatilia malipo ya kodi, au kushughulikia maombi ya ukarabati (maintenance) kwenye nyumba zako. Je, kuna jambo lolote mahususi ungependa nikupe taarifa zake sasa hivi?","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":2492,"output_tokens":120,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite-preview","citations":[]}	completed	2026-10-13 16:48:08	2026-10-13 16:48:08
01a1362d-c8ea-7233-96bc-2bbba413dfe7	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	hi	[]	[]	[]	[]	completed	2026-10-13 16:52:12	2026-10-13 16:52:12
01a1362d-c8f5-739e-8983-cde77f3154cf	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello ibrahim! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha.\n\nAs a landlord, I can assist you with:\n• Inspecting your listed properties and tracking vacant vs occupied units\n• Reviewing your rent collection ledger and active tenants\n• Registering new properties and configuring rentable units/rooms\n• Monitoring maintenance requests across your portfolio\n\nWhat would you like to start with today?	[]	[]	[]	[]	completed	2026-10-13 16:52:12	2026-10-13 16:52:12
01a1362e-3ebb-7241-a3dc-f3ba65c1c054	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	hpw are you	[]	[]	[]	[]	completed	2026-10-13 16:52:42	2026-10-13 16:52:42
01a1362e-3ec7-726f-b5b5-7c0d235a23b0	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello ibrahim! I understand you are inquiring about: "hpw are you".\n\nHere are quick actions you can run with Veyora:\n1. **Search Rentals**: Type 'Search 2-bedroom in Kinondoni' or 'Apartments under 800k TZS'.\n2. **Tenancy Agreement**: Type 'Show my tenancy' to inspect your active lease agreement.\n3. **Rent Ledger**: Type 'Show payment history' to view confirmed rent receipts.\n4. **Maintenance**: Type 'Report water issue' to log plumbing or electrical tickets.\n5. **Landlord Registration**: Type 'How to register a property' for the 5-step unit creation walkthrough.\n\nHow can I specifically assist you right now?	[]	[]	[]	[]	completed	2026-10-13 16:52:42	2026-10-13 16:52:42
01a1362e-9397-706e-96e4-901373acdc7b	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	give me my profile details	[]	[]	[]	[]	completed	2026-10-13 16:53:04	2026-10-13 16:53:04
01a1362e-93a5-7062-980d-958d88fececb	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello ibrahim! I understand you are inquiring about: "give me my profile details".\n\nHere are quick actions you can run with Veyora:\n1. **Search Rentals**: Type 'Search 2-bedroom in Kinondoni' or 'Apartments under 800k TZS'.\n2. **Tenancy Agreement**: Type 'Show my tenancy' to inspect your active lease agreement.\n3. **Rent Ledger**: Type 'Show payment history' to view confirmed rent receipts.\n4. **Maintenance**: Type 'Report water issue' to log plumbing or electrical tickets.\n5. **Landlord Registration**: Type 'How to register a property' for the 5-step unit creation walkthrough.\n\nHow can I specifically assist you right now?	[]	[]	[]	[]	completed	2026-10-13 16:53:04	2026-10-13 16:53:04
01a1362f-672f-7121-9b32-53d6a31af282	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	profile details my name and contacts	[]	[]	[]	[]	completed	2026-10-13 16:53:58	2026-10-13 16:53:58
01a1362f-6759-723f-8c18-576588c9d656	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	Hello! I am Veyora, your official Veyora Housing AI Assistant. I am doing well, thank you!\n\nAs requested, here are your current profile details:\n\n*   **Name:** Ibrahim Kimaro\n*   **Role:** Landlord\n*   **Phone Number:** +255628736374\n*   **Email:** ibrahimkimaro01@gmail.com\n*   **Verification Status:** Approved\n\nHow can I assist you with your property management today?	[]	[{"content":"","tool_calls":[{"id":"call_313314","name":"get_user_profile","arguments":[],"result_id":"call_313314","thought_signature":"EnMKcQFpFH0T8lWMAh40gX2sdbZ\\/vmfSO17fzDfyex\\/glzHuPf1C23qm1x\\/mDndItLzYZv7qLYaxyMEXfNhzv2tf7SWEsptQrACwMt5H3iRGzlVCc0F0L+8O3suXHyW5wtc9t8jKaLlZfQSCqZoyU1aBkttJ","result":"{\\n    \\"id\\": 18,\\n    \\"fullname\\": \\"ibrahim kimaro\\",\\n    \\"email\\": \\"ibrahimkimaro01@gmail.com\\",\\n    \\"phone\\": \\"+255628736374\\",\\n    \\"country\\": \\"TZ\\",\\n    \\"role\\": \\"landlord\\",\\n    \\"identity_status\\": \\"approved\\",\\n    \\"business_profile\\": null\\n}"}],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]},{"content":"Hello! I am Veyora, your official Veyora Housing AI Assistant. I am doing well, thank you!\\n\\nAs requested, here are your current profile details:\\n\\n*   **Name:** Ibrahim Kimaro\\n*   **Role:** Landlord\\n*   **Phone Number:** +255628736374\\n*   **Email:** ibrahimkimaro01@gmail.com\\n*   **Verification Status:** Approved\\n\\nHow can I assist you with your property management today?","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":5288,"output_tokens":122,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite-preview","citations":[]}	completed	2026-10-13 16:53:58	2026-10-13 16:53:58
01a1362f-8b00-73c5-a667-fbc444762fb0	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	Search 2-bedroom apartments in Kinondoni	[]	[]	[]	[]	completed	2026-10-13 16:54:07	2026-10-13 16:54:07
01a1362f-8b13-716e-b438-33c62e41ca8f	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant		[]	[{"content":"","tool_calls":[{"id":"call_209910","name":"get_user_profile","arguments":[],"result_id":"call_209910","thought_signature":"EnMKcQFpFH0Ttr+klF4ytMt9mSPlQbNTlZp\\/P3QjxsMa+2gxLLvjGlA9JT0xKeBldG4\\/CxFk57GQQW54wMNzWGOMfZkJVyjPwKZuQWf0m+p0aB8nBtg40fcX7+IR5jpmOzX98M9VxeV1hhx1uDlg1aJXJQCY","result":"{\\n    \\"id\\": 18,\\n    \\"fullname\\": \\"ibrahim kimaro\\",\\n    \\"email\\": \\"ibrahimkimaro01@gmail.com\\",\\n    \\"phone\\": \\"+255628736374\\",\\n    \\"country\\": \\"TZ\\",\\n    \\"role\\": \\"landlord\\",\\n    \\"identity_status\\": \\"approved\\",\\n    \\"business_profile\\": null\\n}"},{"id":"call_209911","name":"search_properties","arguments":{"q":"2-bedroom","district":"Kinondoni","property_type":"Apartment"},"result_id":"call_209911","thought_signature":"EnMKcQFpFH0Ttr+klF4ytMt9mSPlQbNTlZp\\/P3QjxsMa+2gxLLvjGlA9JT0xKeBldG4\\/CxFk57GQQW54wMNzWGOMfZkJVyjPwKZuQWf0m+p0aB8nBtg40fcX7+IR5jpmOzX98M9VxeV1hhx1uDlg1aJXJQCY","result":"{\\n    \\"count\\": 0,\\n    \\"properties\\": []\\n}"}],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":2637,"output_tokens":47,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite-preview","citations":[],"error":"AI provider [gemini] is overloaded."}	failed	2026-10-13 16:54:07	2026-10-13 16:54:07
01a1362f-caab-71e7-87ee-5bfe470a5076	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	 is active, and I have not found any 2-bedroom apartment listings in Kinondoni at the moment. \n\nWould you like me to try a broader search (e.g., all properties in Kinondoni), or perhaps look for a different property type?	[]	[{"content":" is active, and I have not found any 2-bedroom apartment listings in Kinondoni at the moment. \\n\\nWould you like me to try a broader search (e.g., all properties in Kinondoni), or perhaps look for a different property type?","tool_calls":[],"reasoning":"","replay_blocks":[],"provider_tool_calls":[]}]	{"input_tokens":2846,"output_tokens":55,"cache_read_input_tokens":0,"cache_write_input_tokens":null,"reasoning_tokens":0}	{"provider":"gemini","model":"gemini-3.1-flash-lite-preview","citations":[]}	completed	2026-10-13 16:54:24	2026-10-13 16:54:24
01a13630-0706-7311-8273-7c31f398d8b8	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	user	can you create for me?	[]	[]	[]	[]	completed	2026-10-13 16:54:39	2026-10-13 16:54:39
01a13630-070e-726d-8d70-6fc2660828e3	7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	App\\Ai\\Agents\\VeyoraAssistant	assistant	5-Step Landlord Property & Unit Registration Guide:\n\n1. **Step 1: Basic Information** — Property name, property type (House, Apartment, Studio), and rental model (Entire House vs Individual Units).\n2. **Step 2: Location & NAPA Code** — Region, District, Ward, Street, and physical addressing code.\n3. **Step 3: Units & Pricing** — Define each rentable unit (Master Room, Standard Room), set monthly rent in TZS, and advance deposit terms.\n4. **Step 4: Amenities** — Specify water, electricity meter (LUKU), parking, security, fencing, and furnishings.\n5. **Step 5: Photos & Verification** — Upload exterior and room-by-room photos for admin verification.\n\nTo start, open your Landlord Dashboard and tap '+ Register Property'.	[]	[]	[]	[]	completed	2026-10-13 16:54:39	2026-10-13 16:54:39
\.


--
-- Data for Name: agent_conversations; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.agent_conversations (id, participant_type, participant_id, title, created_at, updated_at) FROM stdin;
01a13607-9ba8-7128-9d77-aba4646af6e0	App\\Models\\User	12	Which properties do I currently have in my portfolio?	2026-10-13 16:11:30	2026-10-13 16:11:30
01a13608-c9c8-7018-b92e-b6d14ec237b3	App\\Models\\User	12	Fake response for prompt: Which properties do I currently have in my portfolio?	2026-10-13 16:11:48	2026-10-13 16:11:48
01a13613-66de-73a3-b22b-d30804a92d1d	App\\Models\\User	8	Fake response for prompt: Habari Kimmy	2026-10-13 16:23:23	2026-10-13 16:23:23
dfc0f2e6-a7f9-432b-bf1d-7bc6dd9f1c90	App\\Models\\User	8	Testing new session	2026-10-13 16:39:07	2026-10-13 16:39:07
a683a9a2-aa54-4f3e-ad3c-642108dbd950	App\\Models\\User	8	Hello test	2026-10-13 16:41:52	2026-10-13 16:41:52
8972e7f6-0946-4f31-927e-1a4331ea7b45	App\\Models\\User	8	hi	2026-10-13 16:42:32	2026-10-13 16:42:32
7cafc8c3-9f4a-47eb-9b7a-d8ea09e45749	App\\Models\\User	8	habari yako	2026-10-13 16:42:48	2026-10-13 16:42:48
7310047a-8ead-489c-94b7-2007d307cfb8	App\\Models\\User	18	hi	2026-10-13 16:47:08	2026-10-13 16:54:39
\.


--
-- Data for Name: ai_settings; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.ai_settings (id, enabled, provider, model, timeout_seconds, rate_per_minute, user_daily_tokens, global_daily_tokens, global_monthly_tokens, monthly_cost_cap, input_price_per_million, output_price_per_million, alert_percent, created_at, updated_at) FROM stdin;
2	t	gemini	gemini-3.1-flash-lite-preview	60	10	50000	2000000	40000000	0.00	0.0000	0.0000	80	2026-10-13 15:47:35	2026-10-13 16:38:09
\.


--
-- Data for Name: ai_usage_logs; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.ai_usage_logs (id, user_id, feature, provider, model, input_tokens, output_tokens, cost, latency_ms, status, error, created_at) FROM stdin;
2	\N	cli_test	gemini	gemini-3.5-flash-lite	0	0	0.000000	30043	error	Could not connect to AI provider [gemini].	2026-10-13 15:48:05
3	\N	cli_test	gemini	gemini-3.8-flash	0	0	0.000000	1868	error	AI provider [gemini] is overloaded.	2026-10-13 15:50:42
4	\N	cli_test	gemini	gemini-3.1-flash-lite	16	1	0.000000	6734	ok	\N	2026-10-13 15:50:58
5	\N	property_assist	gemini	gemini-3.1-flash-lite	0	0	0.000000	2693	error	AI provider [gemini] is overloaded.	2026-10-13 15:51:06
6	8	admin_test	gemini	gemini-3.1-flash-lite	0	0	0.000000	2265	error	AI provider [gemini] is overloaded.	2026-10-13 15:56:03
7	8	admin_test	gemini	emini-3.1-flash-lite	0	0	0.000000	950	error	HTTP request returned status code 404:\n{"error":{"message":"Model 'emini-3.1-flash-lite' not found. Did you mean 'gemini-3.1-flash-lite'? Please verify the mod (truncated...)\n	2026-10-13 15:56:33
8	8	admin_test	gemini	gemini-3.1-flash-lite	16	1	0.000000	9914	ok	\N	2026-10-13 15:57:08
9	8	admin_test	gemini	gemini-3.1-flash-lite	16	1	0.000000	6117	ok	\N	2026-10-13 15:59:08
10	12	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	60384	error	AI provider [gemini] is overloaded.	2026-10-13 16:11:31
11	12	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	261	ok	\N	2026-10-13 16:11:48
12	8	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	30033	error	Could not connect to AI provider [gemini].	2026-10-13 16:23:10
13	8	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	94	ok	\N	2026-10-13 16:23:24
14	18	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	5587	error	AI provider [gemini] is overloaded.	2026-10-13 16:23:38
15	18	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	30040	error	Could not connect to AI provider [gemini].	2026-10-13 16:28:59
16	8	admin_test	gemini	gemini-3.1-flash-lite	16	1	0.000000	26761	ok	\N	2026-10-13 16:29:17
17	18	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	30011	error	Could not connect to AI provider [gemini].	2026-10-13 16:30:37
18	18	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	7176	error	AI provider [gemini] is overloaded.	2026-10-13 16:36:08
19	18	veyora_assistant	gemini	gemini-3.1-flash-lite	0	0	0.000000	10832	error	AI provider [gemini] is overloaded.	2026-10-13 16:36:23
20	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	2434	47	0.000000	12411	ok	\N	2026-10-13 16:47:32
21	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	2492	120	0.000000	16944	ok	\N	2026-10-13 16:48:08
22	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	19553	error	AI provider [gemini] is overloaded.	2026-10-13 16:48:53
23	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	4557	error	AI provider [gemini] is overloaded.	2026-10-13 16:49:28
24	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	12479	error	AI provider [gemini] is overloaded.	2026-10-13 16:52:43
25	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	4068	error	AI provider [gemini] is overloaded.	2026-10-13 16:53:05
26	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	5288	122	0.000000	31865	ok	\N	2026-10-13 16:53:59
27	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	17906	error	AI provider [gemini] is overloaded.	2026-10-13 16:54:08
28	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	2846	55	0.000000	5097	ok	\N	2026-10-13 16:54:24
29	18	veyora_assistant	gemini	gemini-3.1-flash-lite-preview	0	0	0.000000	4594	error	AI provider [gemini] is overloaded.	2026-10-13 16:54:40
\.


--
-- Data for Name: business_profiles; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.business_profiles (id, user_id, entity_name, business_type, tin, brela, vrn, phone, email, address, website, bio, status, rejection_reason, reviewed_by, reviewed_at, submitted_at, created_at, updated_at) FROM stdin;
1	13	Hassan Property Agents	Real Estate Agency	142985231	10948291	\N	+255 700 000 002	office@hassanagents.co.tz	Sam Nujoma Road, Mwenge, Dar es Salaam	www.hassanagents.co.tz	Letting agents for rooms and family houses in Kinondoni and Ubungo since 2019.	approved	\N	8	2026-10-13 12:02:18+00	2026-10-13 12:02:01+00	2026-10-13 12:02:01	2026-10-13 12:02:18
2	12	Mushi Homes Ltd	Property Management	100245908	155902	40-019230-K	+255 700 000 001	neema@mushihomes.co.tz	Toure Drive, Oysterbay, Dar es Salaam	\N	Six family homes and apartments in Kinondoni and Ilala, managed directly by the owner.	rejected	The TIN does not match the business name. Check it against your TRA certificate.	8	2026-10-13 12:06:15+00	2026-10-13 12:05:25+00	2026-10-13 12:05:25	2026-10-13 12:06:15
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.cache (key, value, expiration) FROM stdin;
panga-na-kupangisha-cache-peoplefa35e192121eabf3dabf9f5ea6abdbcbc107ac3b	i:8;	1791898494
panga-na-kupangisha-cache-groupsfa35e192121eabf3dabf9f5ea6abdbcbc107ac3b:timer	i:1791901758;	1791901758
panga-na-kupangisha-cache-ai:user:12:timer	i:1791907967;	1791907967
panga-na-kupangisha-cache-ai:user:18:timer	i:1791910489;	1791910489
panga-na-kupangisha-cache-groupsfa35e192121eabf3dabf9f5ea6abdbcbc107ac3b	i:2;	1791901758
panga-na-kupangisha-cache-identity0716d9708d321ffb6a00818614779e779925365c:timer	i:1791889944;	1791889944
panga-na-kupangisha-cache-identity0716d9708d321ffb6a00818614779e779925365c	i:1;	1791889944
panga-na-kupangisha-cache-ai:user:12	i:1;	1791907967
panga-na-kupangisha-cache-people9e6a55b6b4563e652a23be9d623ca5055c356940:timer	i:1791908432;	1791908432
panga-na-kupangisha-cache-people9e6a55b6b4563e652a23be9d623ca5055c356940	i:1;	1791908432
panga-na-kupangisha-cache-9e6a55b6b4563e652a23be9d623ca5055c356940:timer	i:1791910534;	1791910534
panga-na-kupangisha-cache-9e6a55b6b4563e652a23be9d623ca5055c356940	i:1;	1791910534
panga-na-kupangisha-cache-ai:user:18	i:3;	1791910489
panga-na-kupangisha-cache-3950c659687d31fdea6280c67323b70c432478ea:timer	i:1791889699;	1791889699
panga-na-kupangisha-cache-3950c659687d31fdea6280c67323b70c432478ea	i:1;	1791889699
panga-na-kupangisha-cache-auth3950c659687d31fdea6280c67323b70c432478ea:timer	i:1791902641;	1791902641
panga-na-kupangisha-cache-peoplefa35e192121eabf3dabf9f5ea6abdbcbc107ac3b:timer	i:1791898494;	1791898494
panga-na-kupangisha-cache-businessbd307a3ec329e10a2cff8fb87480823da114f8f4:timer	i:1791896521;	1791896521
panga-na-kupangisha-cache-businessbd307a3ec329e10a2cff8fb87480823da114f8f4	i:2;	1791896521
panga-na-kupangisha-cache-auth3950c659687d31fdea6280c67323b70c432478ea	i:5;	1791902641
panga-na-kupangisha-cache-business7b52009b64fd0a2a49e6d8a939753077792b0554:timer	i:1791896724;	1791896724
panga-na-kupangisha-cache-business7b52009b64fd0a2a49e6d8a939753077792b0554	i:1;	1791896725
panga-na-kupangisha-cache-identity9e6a55b6b4563e652a23be9d623ca5055c356940:timer	i:1791903094;	1791903094
panga-na-kupangisha-cache-identityb3f0c7f6bb763af1be91d9e74eabfeb199dc1f1f:timer	i:1791900963;	1791900963
panga-na-kupangisha-cache-identityb3f0c7f6bb763af1be91d9e74eabfeb199dc1f1f	i:1;	1791900963
panga-na-kupangisha-cache-identity9e6a55b6b4563e652a23be9d623ca5055c356940	i:1;	1791903094
panga-na-kupangisha-cache-fe5dbbcea5ce7e2988b8c69bcfdfde8904aabc1f:timer	i:1791908990;	1791908990
panga-na-kupangisha-cache-fe5dbbcea5ce7e2988b8c69bcfdfde8904aabc1f	i:1;	1791908990
panga-na-kupangisha-cache-ai:user:8:timer	i:1791908990;	1791908990
panga-na-kupangisha-cache-ai:user:8	i:1;	1791908990
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.conversations (id, user_low_id, user_high_id, house_id, created_at, updated_at) FROM stdin;
1	12	14	13	2026-10-13 09:30:51	2026-10-13 13:01:25
2	14	18	\N	2026-10-13 13:36:56	2026-10-13 13:44:53
3	12	18	13	2026-10-13 14:46:23	2026-10-13 15:49:52
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.device_tokens (id, user_id, token, platform, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.favorites (user_id, house_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: house_images; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.house_images (id, house_id, path, caption, created_at, updated_at) FROM stdin;
16	13	houses/demo-h9.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
17	13	houses/demo-h10.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
18	14	houses/demo-h7.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
19	14	houses/demo-h8.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
20	15	houses/demo-h10.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
21	16	houses/demo-h9.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
22	16	houses/demo-h7.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
23	17	houses/demo-h8.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
24	18	houses/demo-h9.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
25	18	houses/demo-h10.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
26	19	houses/demo-h7.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
27	21	houses/demo-h8.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
28	21	houses/demo-h9.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
29	22	houses/demo-h10.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
30	22	houses/demo-h7.jpg	\N	2026-10-13 09:30:51	2026-10-13 09:30:51
36	23	houses/kimaro_residence_exterior.jpg	Property Compound and Gated Driveway	2026-10-13 14:44:18	2026-10-13 14:44:18
37	23	houses/kimaro_kitchen_compound.jpg	Shared Modern Kitchen and Courtyard	2026-10-13 14:44:18	2026-10-13 14:44:18
38	23	houses/kimaro_master_bedroom.jpg	Master Bedroom Suite 1	2026-10-13 14:44:18	2026-10-13 14:44:18
39	23	houses/kimaro_master_bedroom_2.jpg	Master Bedroom Suite 2	2026-10-13 14:44:18	2026-10-13 14:44:18
40	23	houses/kimaro_standard_room.jpg	Standard Bedroom Unit	2026-10-13 14:44:18	2026-10-13 14:44:18
41	23	houses/kimaro_living_room.jpg	Independent Wing A Living Room	2026-10-13 14:44:18	2026-10-13 14:44:18
42	23	houses/kimaro_independent_wing_b.jpg	Independent Wing B Lounge & Terrace	2026-10-13 14:44:18	2026-10-13 14:44:18
\.


--
-- Data for Name: houses; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.houses (id, owner_id, property_name, property_type, property_category, furnishing_status, description, region, district, ward, street, house_number, landmark, bedrooms, bathrooms, square_feet, monthly_rent, security_deposit, maintenance_fee, amenities, contact_name, contact_phone, contact_email, lease_duration, cover_image, status, latitude, longitude, created_at, updated_at, advertiser_role, verified_at, availability_confirmed_at, napa_number) FROM stdin;
16	13	Family house with garden, Mbezi Beach	House	\N	\N	Three bedrooms, large garden and servant quarter. Tarmac road to the gate.	Dar es Salaam	Kinondoni	Mbezi Beach	Africana Road	\N	\N	3	2	\N	1400000.00	8400000.00	\N	["Water","Parking","Fence","Security","Garden"]	Juma Hassan	+255700000002	\N	6 months upfront	houses/demo-h2.jpg	available	-6.718300	39.218500	2026-10-12 12:30:51	2026-10-13 09:30:51	representative	2026-08-29 09:30:51+00	2026-10-08 09:30:51+00	\N
17	12	Studio in Upanga, walk to town	Studio	\N	\N	Furnished studio on the fifth floor with lift and 24-hour guard. Water tank on the roof.	Dar es Salaam	Ilala	Upanga	Mindu Street	\N	\N	1	1	\N	520000.00	1560000.00	\N	["Water","Security","Lift","AC","WiFi"]	Neema Mushi	+255700000001	\N	3 months upfront	houses/demo-h7.jpg	available	-6.808300	39.284600	2026-10-12 05:30:51	2026-10-13 09:30:51	owner	2026-09-23 09:30:51+00	2026-10-12 09:30:51+00	\N
18	13	Three-bedroom apartment, Masaki	Apartment	\N	\N	Sea view from the living room, shared pool, backup generator for the whole building.	Dar es Salaam	Kinondoni	Masaki	Haile Selassie Road	\N	\N	3	3	\N	2600000.00	7800000.00	\N	["Water","Parking","Security","Generator","Pool","AC","Lift"]	Juma Hassan	+255700000002	\N	3 months upfront	houses/demo-h12.jpg	available	-6.748200	39.276400	2026-10-11 22:30:51	2026-10-13 09:30:51	representative	2026-10-04 09:30:51+00	2026-10-11 09:30:51+00	\N
14	12	Two-bedroom flat, Mikocheni B	Apartment	\N	\N	Second floor, tiled throughout, own LUKU meter. Ten minutes on foot to Shoppers Plaza.	Dar es Salaam	Kinondoni	Mikocheni	Rose Garden Road	\N	\N	2	2	\N	850000.00	2550000.00	\N	["Water","Parking","Security","Tiles","LUKU"]	Neema Mushi	+255700000001	\N	3 months upfront	houses/demo-h3.jpg	available	-6.764800	39.243700	2026-10-13 02:30:51	2026-10-13 09:30:51	owner	2026-09-13 09:30:51+00	2026-10-11 09:30:51+00	\N
21	12	Modern townhouse, Tabata Segerea	House	\N	\N	Three bedrooms over two floors in a gated row of eight houses.	Dar es Salaam	Ilala	Tabata	Segerea Road	\N	\N	3	2	\N	750000.00	3000000.00	\N	["Water","Parking","Fence","Security","Tiles"]	Neema Mushi	+255700000001	\N	4 months upfront	houses/demo-h5.jpg	available	-6.830100	39.227600	2026-10-11 01:30:51	2026-10-13 09:30:51	owner	2026-08-14 09:30:51+00	2026-10-09 09:30:51+00	\N
22	12	Garden cottage, Kinondoni Makumbusho	House	\N	\N	Detached two-bedroom cottage behind the main house, with its own gate and meter.	Dar es Salaam	Kinondoni	Makumbusho	Kajenge Road	\N	\N	2	1	\N	600000.00	1800000.00	\N	["Water","Parking","Fence","Garden"]	Neema Mushi	+255700000001	\N	3 months upfront	houses/demo-h1.jpg	available	-6.779900	39.241200	2026-10-10 18:30:51	2026-10-13 09:30:51	owner	2026-09-28 09:30:51+00	2026-10-07 09:30:51+00	\N
15	13	Self-contained room, Sinza Mori	Room	\N	\N	Master room with its own bathroom in a fenced compound of six rooms. Shared outdoor kitchen space.	Dar es Salaam	Ubungo	Sinza	Sinza Mori	\N	\N	1	1	\N	180000.00	1080000.00	\N	["Water","LUKU","Tiles","Fence"]	Juma Hassan	+255700000002	\N	6 months upfront	houses/demo-h8.jpg	available	-6.783800	39.221400	2026-10-12 19:30:51	2026-10-13 09:32:26	representative	2026-10-13 09:32:26+00	2026-10-10 09:30:51+00	\N
13	12	Sea-breeze villa near Coco Beach	House	\N	\N	Four bedrooms on a quiet stretch of Toure Drive. Borehole and city water, standby generator, parking for three cars.	Dar es Salaam	Kinondoni	Oysterbay	Toure Drive	\N	\N	4	3	\N	3200000.00	9600000.00	\N	["Water","Parking","Security","Generator","Fence","AC"]	Neema Mushi	+255700000001	\N	3 months upfront	houses/demo-h4.jpg	available	-6.772100	39.281200	2026-10-13 09:30:51	2026-10-13 09:48:31	owner	2026-10-01 09:30:51+00	2026-10-12 09:30:51+00	\N
19	12	New two-bedroom house, Kigamboni	House	\N	\N	Built this year. Fifteen minutes from the Nyerere Bridge, daladala stop at the corner.	Dar es Salaam	Kigamboni	Kibada	Kibada Road	\N	\N	2	1	\N	400000.00	2400000.00	\N	["Water","Parking","Fence","Tiles","LUKU"]	Neema Mushi	+255700000001	\N	6 months upfront	houses/demo-h11.jpg	available	-6.861200	39.330500	2026-10-11 15:30:51	2026-10-13 11:51:17	owner	2026-10-13 11:51:17+00	2026-10-04 09:30:51+00	\N
20	13	Single room near Mwenge bus stand	Room	\N	\N	One room in a shared house, shared bathroom. Five minutes to Mwenge stand and Mlimani City.	Dar es Salaam	Kinondoni	Mwenge	Sam Nujoma Road	\N	\N	1	1	\N	120000.00	720000.00	\N	["Water","LUKU"]	Juma Hassan	+255700000002	\N	6 months upfront	houses/demo-h10.jpg	available	-6.770200	39.227900	2026-10-11 08:30:51	2026-10-13 13:28:49	representative	2026-10-13 13:28:49+00	2026-09-03 09:30:51+00	\N
23	18	Kimaro Modern Residence	House	Residential	Furnished	Kimaro Modern Residence is a secure, well-maintained multi-unit property situated in Mbezi Beach, Kinondoni, Dar es Salaam along Africana Road. The compound features 5 distinct residential accommodation options designed for flexible tenancy:\n\n1. Master Bedroom Unit 1: Self-contained master bedroom with private en-suite bathroom, built-in wardrobes, air conditioning, and tiled flooring. Rent: TZS 25,000 per month (4 months advance payment required).\n2. Master Bedroom Unit 2: Self-contained master bedroom with private en-suite bathroom, built-in wardrobes, air conditioning, and tiled flooring. Rent: TZS 25,000 per month (4 months advance payment required).\n3. Standard Bedroom Unit: Clean standard bedroom with shared modern bathroom, wardrobe, ceiling fan, and tiled flooring. Rent: TZS 10,000 per month (6 months advance payment required).\n4. Independent Full House Wing A: Self-contained 3-bedroom private house with spacious living and dining room, fitted modern kitchen, master en-suite and 2 additional bedrooms, private entrance. Rent: TZS 550,000 per month (4 months advance payment required).\n5. Independent Full House Wing B: Self-contained 3-bedroom private house with spacious living and dining room, fitted modern kitchen, master en-suite and 2 additional bedrooms, private entrance. Rent: TZS 550,000 per month (4 months advance payment required).\n\nThe property benefits from 24-hour security, perimeter wall with electric fencing, paved interlocking parking, dedicated LUKU electricity meters, reliable clean water reserve tanks, and standby generator access. Located conveniently near public transport, schools, shopping centers, and beach access.	Dar es Salaam	Kinondoni	Mbezi Beach	Africana Road	Plot 42, Block B	Near Africana Junction and Mbezi Beach High School	8	6	4500	25000.00	100000.00	0.00	["Water","LUKU","Parking","Security","Fence","Tiles","AC","WiFi","Generator","Garden"]	Ibrahim Kimaro	+255628736374	ibrahimkimaro01@gmail.com	4 to 6 months terms	houses/kimaro_residence_exterior.jpg	available	-6.705820	39.218540	2026-10-13 14:34:39	2026-10-13 14:53:34	owner	2026-10-13 14:53:34+00	2026-10-13 14:45:39+00	14111-MBZ-042
\.


--
-- Data for Name: identity_verifications; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.identity_verifications (id, user_id, method, nida_number, document_path, status, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
1	12	nida_number	eyJpdiI6IlBlcUYxNmZtZTBaMzR1QncyRjNuelE9PSIsInZhbHVlIjoiT2xCakU0UkdXR1BaMEZScmhQdUtwYlUrcmdHR3NuZldBNlNWZXY4QkZtOD0iLCJtYWMiOiJhNzFiNzczZjg5MTcxMTViMGRlMDg2NGQyZTgzZWI2N2U2ODQxYTYzNmRhMmRjNjM0ZGM1M2Q2ZjJhMzgxMzg3IiwidGFnIjoiIn0=	\N	approved	\N	\N	2026-10-13 10:05:31+00	2026-10-13 10:05:31	2026-10-13 10:05:31
2	13	nida_number	eyJpdiI6Ikh2VmcreExhbkNaWHNCU2JFU2FPN2c9PSIsInZhbHVlIjoienhSYm8wN2NCeEJ0SUY1KzFkT2IzTDIvVjZ2RXRzaHBiR0hCNnVnVzErbz0iLCJtYWMiOiJjYjAxMGU3YzljZDdhMmYwNjFhOWM4Mzc5NzNmZjQ2N2IxYjJkYTYyNWI0ZTU1NjM0NTM3ZGJiMjU3ZjkyNzZkIiwidGFnIjoiIn0=	\N	approved	\N	\N	2026-10-13 10:05:31+00	2026-10-13 10:05:31	2026-10-13 10:05:31
3	17	nida_number	eyJpdiI6IlBscis2d0JKbkVmZFhBekxmTkhFR1E9PSIsInZhbHVlIjoiRk5IWGorUllHeW50cWZ0b1NsU2ZBMWZzZWlrMjlPSXpZOFhWakpxTXMyaz0iLCJtYWMiOiJjMDhiM2Y0NGU5ZWMyMGQ5OTE1OTk4NDNlMWJiYTU2NDAwMzUxZWYwNDM1NGUyMjZkOGYxMzBkNTg4N2RlMjNmIiwidGFnIjoiIn0=	\N	rejected	The NIDA number does not match the name on your account.	8	2026-10-13 10:11:58+00	2026-10-13 10:05:31	2026-10-13 10:11:58
4	17	nida_number	eyJpdiI6IkZyVUQvSUxwa0RIUmVjdDQwanF1V3c9PSIsInZhbHVlIjoiLzFnWTFORW8xVkhidVEzYVpKYjlXWWs1UmlpZmY3c01XcUJRVVZCMmhoWT0iLCJtYWMiOiI3M2NkZGZhODQ1NWRiNDg3MDQzZGUwZjM2NDdjYThmM2RhZDcyMmI4Mjc2MTE3MTQ2YWM4NjE5NDEzYWNhZTdiIiwidGFnIjoiIn0=	\N	approved	\N	8	2026-10-13 10:12:43+00	2026-10-13 10:12:24	2026-10-13 10:12:43
6	19	nida_number	eyJpdiI6InBnN29odXhTWDhKbE1ycFRmK2l1SXc9PSIsInZhbHVlIjoicGpQcUFJN25ONTZNN2ljK3VzVmd2ZXl2ZW96UWVaSkh4L2VlY2FoK0RPYz0iLCJtYWMiOiI4ZWZlMThkZWIzYjU5NjE4ZWUwZjE4OWUwN2U2NDhmNTkwYTcxZDAwZTk2OWMzNDFjODE0ZTNiYmZiMDllZWM5IiwidGFnIjoiIn0=	\N	rejected	This is not a NIDA card. Send your national ID.	8	2026-10-13 13:29:48+00	2026-10-13 13:16:03	2026-10-13 13:29:48
5	18	nida_number	eyJpdiI6IjJ1czd6VUh2b2p1RWdaanVoLzFpeGc9PSIsInZhbHVlIjoidzNuTmYzNGs3SEhic003dlcya20xZDYyd0FoQnN5b0pBOFR4OEJBRnlDWT0iLCJtYWMiOiI5NTM0NGJiMmY4OWE1YmNlOTE1M2FkZWIyNzYyN2Y2MjQ4NTMxODdiZTY2NTcwNjA5NGE2ZTRjMWZiYTExOTQzIiwidGFnIjoiIn0=	\N	rejected	The NIDA number does not match the name on your account.	8	2026-10-13 13:29:59+00	2026-10-13 11:07:08	2026-10-13 13:29:59
7	18	nida_number	eyJpdiI6IitJaDZjQkpQdk1pcWtvYkxobi9Ja1E9PSIsInZhbHVlIjoiUGRJKzVjbkV2emh5NlFhM1ZMckVGYURMZzQxYWw3bVYvRCtrRW9jVmVIST0iLCJtYWMiOiI0MmZlMzJiYzAwMTY1N2IyNzdhMmVlNWY2NTQ4ZDNmNzI3MTc5ZDM4NmRjY2QzMjM3ZmM1ZTIyNzAzNjMyYjk3IiwidGFnIjoiIn0=	\N	approved	\N	8	2026-10-13 13:51:45+00	2026-10-13 13:51:34	2026-10-13 13:51:45
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: listing_reports; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.listing_reports (id, house_id, user_id, reason, details, status, created_at, updated_at) FROM stdin;
3	15	16	Already rented	I called and was told the room was taken last month.	open	2026-10-13 09:30:51	2026-10-13 09:30:51
2	20	15	Asked for money before a viewing	The advertiser asked me to send TSh 50,000 by M-Pesa to hold the room before I could see it.	resolved	2026-10-13 09:30:51	2026-10-13 09:32:28
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.maintenance_requests (id, house_id, tenancy_id, title, details, status, created_at, updated_at) FROM stdin;
5	14	6	Leaking kitchen tap	Drips all night; the bucket fills by morning.	open	2026-10-12 14:08:10	2026-10-13 14:08:10
6	17	7	AC not cooling	Runs but blows warm air since Sunday.	in_progress	2026-10-10 14:08:10	2026-10-13 14:08:10
7	21	8	Gate lock is broken	\N	open	2026-10-09 14:08:10	2026-10-13 14:08:10
8	22	9	Light fitting in the sitting room	Replaced the holder and the bulb.	resolved	2026-10-04 14:08:10	2026-10-13 14:08:10
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_10_12_120008_create_personal_access_tokens_table	1
5	2026_10_12_120102_create_notifications_table	1
6	2026_10_12_130000_create_panga_tables	1
7	2026_10_12_140000_add_marketplace_tables	1
8	2026_10_13_090000_add_admin_tables	1
9	2026_10_13_120000_create_identity_verifications_table	2
10	2026_10_13_150000_add_country_to_users	3
11	2026_10_13_170000_create_business_profiles_table	4
12	2026_10_13_190000_create_rental_tables	5
13	2026_10_13_200000_add_napa_number_to_houses_table	6
14	2026_10_13_210000_add_room_details_to_units_table	7
15	2026_10_13_230000_create_ai_tables	8
16	2026_01_11_000001_create_agent_conversations_table	9
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) FROM stdin;
df03fa16-1cbd-4bf9-b04c-3ff8487b91e0	App\\Notifications\\AppNotification	App\\Models\\User	17	{"kind":"identity","title":"Identity check needs another try","body":"The NIDA number does not match the name on your account.","link":null}	\N	2026-10-13 10:11:59	2026-10-13 10:11:59
c2f5cf52-8943-4f85-a916-c259c21307ed	App\\Notifications\\AppNotification	App\\Models\\User	17	{"kind":"identity","title":"Identity verified","body":"Thank you. You can now list your homes on Panga.","link":null}	\N	2026-10-13 10:12:43	2026-10-13 10:12:43
fbba94cd-0744-4b84-8e56-1eb3fc2a69c9	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"identity","title":"Identity verified","body":"Thank you. You can now list your homes on Panga.","link":null}	2026-10-13 11:08:40	2026-10-13 11:07:34	2026-10-13 11:08:40
0a3203ce-4aab-4964-9f18-c9b534903396	App\\Notifications\\AppNotification	App\\Models\\User	12	{"kind":"announcement","title":"Welcome to Panga","body":"Thank you for joining. Add your first home from the Properties tab.","link":null}	\N	2026-10-13 11:32:53	2026-10-13 11:32:53
20586b4b-d2d7-43c0-b4b7-b527a13b096c	App\\Notifications\\AppNotification	App\\Models\\User	13	{"kind":"announcement","title":"Welcome to Panga","body":"Thank you for joining. Add your first home from the Properties tab.","link":null}	\N	2026-10-13 11:32:53	2026-10-13 11:32:53
96911b07-a109-4735-bde0-e8499ba9a0d5	App\\Notifications\\AppNotification	App\\Models\\User	17	{"kind":"announcement","title":"Welcome to Panga","body":"Thank you for joining. Add your first home from the Properties tab.","link":null}	\N	2026-10-13 11:32:53	2026-10-13 11:32:53
68b5c66d-9c97-4d4f-a91c-2292ef2c74c0	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"announcement","title":"Welcome to Panga","body":"Thank you for joining. Add your first home from the Properties tab.","link":null}	2026-10-13 11:34:13	2026-10-13 11:32:54	2026-10-13 11:34:13
33bc35e1-8250-43e6-965e-da07ecbbe1c9	App\\Notifications\\AppNotification	App\\Models\\User	13	{"kind":"business","title":"Business verified","body":"Hassan Property Agents now shows as a verified business.","link":null}	\N	2026-10-13 12:02:18	2026-10-13 12:02:18
ce747af4-5e82-4690-9ca4-a252a494128a	App\\Notifications\\AppNotification	App\\Models\\User	12	{"kind":"business","title":"Business details need changes","body":"The TIN does not match the business name. Check it against your TRA certificate.","link":null}	\N	2026-10-13 12:06:15	2026-10-13 12:06:15
22276e25-8219-403c-a0d1-9640abe5d49a	App\\Notifications\\AppNotification	App\\Models\\User	14	{"kind":"message","title":"Add your business details","body":"Open Account, then Business Information, and send your business details so we can verify your business.","link":null}	\N	2026-10-13 12:14:33	2026-10-13 12:14:33
d4a83d0d-21ea-4750-b1a4-b0ab85960bd2	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"message","title":"BUSINESS VERIFICATION","body":"we genunly inform you ibrahim to cover your business details","link":null}	2026-10-13 12:20:25	2026-10-13 12:20:14	2026-10-13 12:20:25
1e956190-cd7b-4ea0-8388-b99df749754f	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"message","title":"Add your business details","body":"Open Account, then Business Information, and send your business details so we can verify your business.","link":null,"user_id":18,"user_name":"ibrahim kimaro","app":"Panga na Kupangisha"}	2026-10-13 12:54:39	2026-10-13 12:54:30	2026-10-13 12:54:39
5c5d83db-03c9-43bf-a708-3718323a7c34	App\\Notifications\\AppNotification	App\\Models\\User	19	{"kind":"identity","title":"Identity verified","body":"Thank you. You can now list your homes on Panga.","link":null,"user_id":19,"user_name":"tamimu","app":"Panga na Kupangisha"}	2026-10-13 13:20:03	2026-10-13 13:16:44	2026-10-13 13:20:03
69c661aa-9c64-49f1-a766-75a487ecb584	App\\Notifications\\AppNotification	App\\Models\\User	12	{"kind":"group","title":"Added to \\u201cViewing on Saturday\\u201d","body":"Amina Said added you to a group chat.","link":"room:g-11fzvnnuepxz3pgtekurbjrh","user_id":12,"user_name":"Neema Mushi","app":"Panga na Kupangisha"}	\N	2026-10-13 13:29:18	2026-10-13 13:29:18
5e3d4b61-79e4-4450-af82-df89cfca4ca7	App\\Notifications\\AppNotification	App\\Models\\User	13	{"kind":"group","title":"Added to \\u201cViewing on Saturday\\u201d","body":"Amina Said added you to a group chat.","link":"room:g-11fzvnnuepxz3pgtekurbjrh","user_id":13,"user_name":"Juma Hassan","app":"Panga na Kupangisha"}	\N	2026-10-13 13:29:18	2026-10-13 13:29:18
594cdd01-9521-4056-8057-c1fc6b8f6e11	App\\Notifications\\AppNotification	App\\Models\\User	19	{"kind":"identity","title":"Your verification was withdrawn","body":"This is not a NIDA card. Send your national ID.","link":null,"user_id":19,"user_name":"tamimu","app":"Panga na Kupangisha"}	\N	2026-10-13 13:29:48	2026-10-13 13:29:48
f9231c63-27b4-4fc2-b469-19e99be9b3b7	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"identity","title":"Your verification was withdrawn","body":"The NIDA number does not match the name on your account.","link":null,"user_id":18,"user_name":"ibrahim kimaro","app":"Panga na Kupangisha"}	2026-10-13 13:30:03	2026-10-13 13:29:59	2026-10-13 13:30:03
33bc3a6a-818e-4f13-b17a-7c3655e47221	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"identity","title":"Identity verified","body":"Thank you. You can now list your homes on Panga.","link":null,"user_id":18,"user_name":"ibrahim kimaro","app":"Panga na Kupangisha"}	2026-10-13 13:54:07	2026-10-13 13:51:45	2026-10-13 13:54:07
7079e0bb-f8d0-4b91-b035-17a8fbe6a816	App\\Notifications\\AppNotification	App\\Models\\User	12	{"kind":"viewing","title":"New viewing request","body":"ibrahim kimaro wants to view Sea-breeze villa near Coco Beach.","link":"house:13","user_id":12,"user_name":"Neema Mushi","app":"Panga na Kupangisha"}	\N	2026-10-13 14:46:20	2026-10-13 14:46:20
08396907-eb30-461f-a949-0bbbe51f4008	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"listing","title":"Listing verified","body":"Your property \\u201cKimaro Modern Residence\\u201d has been verified by admin. It is now marked with the verified badge.","link":"house:23","user_id":18,"user_name":"ibrahim kimaro","app":"Panga na Kupangisha"}	2026-10-13 14:52:58	2026-10-13 14:52:50	2026-10-13 14:52:58
521f6b46-d6c5-4025-a714-3e5966aa9510	App\\Notifications\\AppNotification	App\\Models\\User	18	{"kind":"listing","title":"Listing verified","body":"Your property \\u201cKimaro Modern Residence\\u201d has been verified by admin. It is now marked with the verified badge.","link":"house:23","user_id":18,"user_name":"ibrahim kimaro","app":"Panga na Kupangisha"}	2026-10-13 14:53:40	2026-10-13 14:53:34	2026-10-13 14:53:40
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
2	App\\Models\\User	14	mobile	9eb89a87d4a19647ba3d904d86f90c583f6e89e9f8ce279f1ffeecee820adbbb	["*"]	\N	2026-12-12 09:35:34	2026-10-13 09:35:34	2026-10-13 09:35:34
3	App\\Models\\User	14	mobile	7c58da43249e560218043b65b28cbce9c3d769013a723f46d8a1709472487340	["*"]	2026-10-13 09:48:33	2026-12-12 09:48:33	2026-10-13 09:48:33	2026-10-13 09:48:33
11	App\\Models\\User	14	mobile	dcefc5c7c27399b7fb4f6f88f34165a12d680c3e0c9d7658b38abc4273a58723	["*"]	2026-10-13 13:01:25	2026-12-12 13:01:25	2026-10-13 13:01:25	2026-10-13 13:01:25
12	App\\Models\\User	12	mobile	36d557ba73f620d2f3ca2144f70c49dd52397b443844ed8d7524f91a073faf7f	["*"]	2026-10-13 13:01:25	2026-12-12 13:01:25	2026-10-13 13:01:25	2026-10-13 13:01:25
13	App\\Models\\User	14	mobile	c2ea8bb2f4d53aa2e1e13bf55e9d48dce6c6037ab44e5d7fd29febb305284c02	["*"]	2026-10-13 13:01:49	2026-12-12 13:01:49	2026-10-13 13:01:49	2026-10-13 13:01:49
6	App\\Models\\User	13	mobile	9757d75ba0761ddeda5480f24cfe7b9f0a0becd0ccb22b59eb87207ab591a538	["*"]	2026-10-13 12:02:30	2026-12-12 12:02:01	2026-10-13 12:02:01	2026-10-13 12:02:30
14	App\\Models\\User	12	mobile	09e0295335d8d0b11571475a08de686bfd3c5090078cda0ba64cf5bf293ca725	["*"]	2026-10-13 13:01:49	2026-12-12 13:01:49	2026-10-13 13:01:49	2026-10-13 13:01:49
7	App\\Models\\User	12	mobile	a38f10329538cb486ec161bb3feab7dcc77fbd1a742a8898071c00a1163bc38c	["*"]	2026-10-13 12:05:24	2026-12-12 12:05:24	2026-10-13 12:05:24	2026-10-13 12:05:24
15	App\\Models\\User	14	mobile	79c160d211987335490660089ecb82817eb450544f486ac445bf45391d403dd7	["*"]	2026-10-13 13:02:22	2026-12-12 13:02:22	2026-10-13 13:02:22	2026-10-13 13:02:22
16	App\\Models\\User	12	mobile	f6103bd6ee5ec48611f2a2c97de2198b2445006380a96bc900ad46d6b6428d11	["*"]	2026-10-13 13:02:22	2026-12-12 13:02:22	2026-10-13 13:02:22	2026-10-13 13:02:22
17	App\\Models\\User	14	mobile	88c511d9732ae250f0f11b5b1485f6c9e2f1885b34c294aa09fbf8811c27cef8	["*"]	2026-10-13 13:03:01	2026-12-12 13:03:01	2026-10-13 13:03:01	2026-10-13 13:03:01
18	App\\Models\\User	12	mobile	75eea75581bcfd2a63397566614f51944ea21bac523e2fcf9ad5dea3dfc5a859	["*"]	2026-10-13 13:03:01	2026-12-12 13:03:01	2026-10-13 13:03:01	2026-10-13 13:03:01
19	App\\Models\\User	14	mobile	efcdafb31d9f0da37a4a228408d25212770967e5e854ce46970e4218ff72293d	["*"]	2026-10-13 13:03:12	2026-12-12 13:03:12	2026-10-13 13:03:12	2026-10-13 13:03:12
33	App\\Models\\User	14	mobile	fa10c7a41dd5f9067d96fc010e863f256852be38464948f9828af6ca2d77760c	["*"]	2026-10-13 13:33:54	2026-12-12 13:33:54	2026-10-13 13:33:54	2026-10-13 13:33:54
34	App\\Models\\User	14	mobile	471d12d1d1dd4eb3cd83f3554de0cb2e1eee407d79f31a1575322e1c8724d8ca	["*"]	2026-10-13 13:33:56	2026-12-12 13:33:56	2026-10-13 13:33:56	2026-10-13 13:33:56
10	App\\Models\\User	14	mobile	f69ac53854b1d47d1a0dfbf44a154ea0339b1b201d7ba221562f8e37a6cece6d	["*"]	2026-10-13 12:56:43	2026-12-12 12:56:43	2026-10-13 12:56:43	2026-10-13 12:56:43
35	App\\Models\\User	14	mobile	25fcb11a35675a914d9fbab839e346efda69ecaff733d9bf7d8bc839bbb58e14	["*"]	2026-10-13 13:33:59	2026-12-12 13:33:59	2026-10-13 13:33:59	2026-10-13 13:33:59
36	App\\Models\\User	14	mobile	e4c8b04335d3cb72b8495ecb28755c7ef85d607e50862388e8d342e7ab2cc353	["*"]	2026-10-13 13:34:01	2026-12-12 13:34:01	2026-10-13 13:34:01	2026-10-13 13:34:01
37	App\\Models\\User	14	mobile	045cfd22657c4836a37c0f2e7ac4b77c72b1b854da69fa83f1f6d6f5c5519304	["*"]	2026-10-13 13:34:32	2026-12-12 13:34:32	2026-10-13 13:34:32	2026-10-13 13:34:32
8	App\\Models\\User	14	mobile	6b151eabeb0ba52f44f36fdec662604aec11f4334d0e5e883f44b6e4bec2ad38	["*"]	2026-10-13 12:14:17	2026-12-12 12:14:17	2026-10-13 12:14:17	2026-10-13 12:14:17
9	App\\Models\\User	14	mobile	9b8dd1f558cc70e600d63e1789a7f5a140ff44a5a05bbd9b32866319e594c53e	["*"]	2026-10-13 12:31:47	2026-12-12 12:31:47	2026-10-13 12:31:47	2026-10-13 12:31:47
23	App\\Models\\User	14	mobile	9eaeefb845d056f650bf5d56794c568518fae819b3ca76490b145a88c9fc988a	["*"]	2026-10-13 13:32:42	2026-12-12 13:32:42	2026-10-13 13:32:42	2026-10-13 13:32:42
24	App\\Models\\User	13	mobile	cf41cafa1c951efa136d94f3648a59f9edbc33e5d3da9580c5775f5ee7dddcbe	["*"]	2026-10-13 13:32:42	2026-12-12 13:32:42	2026-10-13 13:32:42	2026-10-13 13:32:42
25	App\\Models\\User	15	mobile	355cb989b5050f2380fd1f7d742ba82eed111a3aa7055aa0831538500e0323b6	["*"]	2026-10-13 13:32:43	2026-12-12 13:32:43	2026-10-13 13:32:43	2026-10-13 13:32:43
26	App\\Models\\User	14	mobile	8467d4031232ffda46e93cd47d736116d3ee7f5b3c375fbfc985ea172cbffb79	["*"]	\N	2026-12-12 13:33:11	2026-10-13 13:33:11	2026-10-13 13:33:11
27	App\\Models\\User	14	mobile	2aaa839b9ad3c3cada61250abcfe49185fb34f9f6a9a6da67b60a0ba30603d8f	["*"]	\N	2026-12-12 13:33:13	2026-10-13 13:33:13	2026-10-13 13:33:13
28	App\\Models\\User	14	mobile	07712d8799f731b0f71098ffc0fb5a01f50109f67def34af05f5b205ba73483c	["*"]	\N	2026-12-12 13:33:15	2026-10-13 13:33:15	2026-10-13 13:33:15
29	App\\Models\\User	14	mobile	0b76c1adb05ad3c2149d481d25c678bfe546f3f922b6f675d0c1275192f14204	["*"]	\N	2026-12-12 13:33:17	2026-10-13 13:33:17	2026-10-13 13:33:17
30	App\\Models\\User	14	mobile	449b871e0e772a22c2ff70fb858185d55052da329edc3f9de49cd309c011d307	["*"]	\N	2026-12-12 13:33:18	2026-10-13 13:33:18	2026-10-13 13:33:18
22	App\\Models\\User	14	mobile	ed24331ed00fd0bc288a99884f7fcaf57578b8fc3cae0f1616ec98e60da00ba0	["*"]	2026-10-13 13:29:18	2026-12-12 13:29:18	2026-10-13 13:29:18	2026-10-13 13:29:18
31	App\\Models\\User	14	mobile	734395ee2cd60142231c5d4833c7946ca123f3ad5a90745829539121ea043dfe	["*"]	\N	2026-12-12 13:33:31	2026-10-13 13:33:31	2026-10-13 13:33:31
32	App\\Models\\User	14	mobile	fc4ef60a8253d31f0421c9f2984c9997932a748607f2274c2ef4eb6cc8f9e82f	["*"]	2026-10-13 13:33:53	2026-12-12 13:33:52	2026-10-13 13:33:52	2026-10-13 13:33:53
38	App\\Models\\User	14	mobile	7af2b510b0175b69cc0b8e137712f0a50dc45adc1bcfb5eb7126f40787b1b1b8	["*"]	2026-10-13 13:34:34	2026-12-12 13:34:34	2026-10-13 13:34:34	2026-10-13 13:34:34
39	App\\Models\\User	14	mobile	7744652a8c3bbd275cb46b354138310df42115669edcc1df8d6cf8d31650cdb2	["*"]	2026-10-13 13:34:36	2026-12-12 13:34:36	2026-10-13 13:34:36	2026-10-13 13:34:36
40	App\\Models\\User	14	mobile	d76b948b096cea6a41c22082325d00af2eab68b4a0cfb00c7a8689fe0cfdf40a	["*"]	2026-10-13 13:34:38	2026-12-12 13:34:38	2026-10-13 13:34:38	2026-10-13 13:34:38
41	App\\Models\\User	14	mobile	f388536dd40ae4020007057998ce1ebcb3cdd3ab419bd5cca9ecad82c6631ef3	["*"]	2026-10-13 13:34:41	2026-12-12 13:34:41	2026-10-13 13:34:41	2026-10-13 13:34:41
44	App\\Models\\User	12	mobile	8e65186612b563d2062413e0cd3aea4454c413ec75353f512182dc191d630c29	["*"]	2026-10-13 13:48:38	2026-12-12 13:48:37	2026-10-13 13:48:37	2026-10-13 13:48:38
42	App\\Models\\User	12	mobile	bf20edc8a4567f9d47ed9a128b39b6ac615f4ff94af0dd2fbb140595cf2f6bea	["*"]	2026-10-13 13:48:33	2026-12-12 13:48:32	2026-10-13 13:48:32	2026-10-13 13:48:33
43	App\\Models\\User	12	mobile	2c423cfc4f8bb2fcb81961c2c5896f2982405c173d45668cdeb691e1e987f598	["*"]	2026-10-13 13:48:35	2026-12-12 13:48:35	2026-10-13 13:48:35	2026-10-13 13:48:35
45	App\\Models\\User	12	mobile	2b9e38ab719cc2ecd00fe54afadadd4a792c11e38b72ebf236676ffb7d49b241	["*"]	2026-10-13 13:48:42	2026-12-12 13:48:42	2026-10-13 13:48:42	2026-10-13 13:48:42
46	App\\Models\\User	12	mobile	aa4da28c25913ed8ea130dcf72dba97fc7b63d43e6f399789fa2c08f841ebcef	["*"]	2026-10-13 13:48:45	2026-12-12 13:48:45	2026-10-13 13:48:45	2026-10-13 13:48:45
47	App\\Models\\User	12	mobile	9c1c658c3ba82579e133d7abc41b801a5c5d6f0b02945abc2d2652a25d18df6f	["*"]	2026-10-13 13:48:47	2026-12-12 13:48:47	2026-10-13 13:48:47	2026-10-13 13:48:47
49	App\\Models\\User	12	mobile	0ab7f744e18f578430541cad543ab5c710e72cf611724f7d02faf3d0e39f3c17	["*"]	2026-10-13 13:49:45	2026-12-12 13:49:45	2026-10-13 13:49:45	2026-10-13 13:49:45
48	App\\Models\\User	12	mobile	b2053212115adb8885b24068985223f3ceeffcc38c89fdb23240af2044aa40aa	["*"]	2026-10-13 13:49:39	2026-12-12 13:49:38	2026-10-13 13:49:38	2026-10-13 13:49:39
50	App\\Models\\User	12	mobile	000d1438ce011e5f1f1ee2d8e284793eab01f94c922fca10fd82344cc5e56695	["*"]	2026-10-13 13:50:10	2026-12-12 13:50:09	2026-10-13 13:50:09	2026-10-13 13:50:10
51	App\\Models\\User	12	mobile	c697285c440a86cb28d570089216e9b4645a22b4afcc46d79b5ea54e241f754c	["*"]	2026-10-13 13:50:16	2026-12-12 13:50:16	2026-10-13 13:50:16	2026-10-13 13:50:16
52	App\\Models\\User	12	mobile	b18c5e79868fa1ea095a7a94e7eae950e1631dcea8d875d99b3a52268595fee2	["*"]	2026-10-13 13:50:33	2026-12-12 13:50:22	2026-10-13 13:50:22	2026-10-13 13:50:33
53	App\\Models\\User	12	mobile	62e6e57eb59f155bc99fa19f1d7628847208628f941dcb7fdc45d45632fa535a	["*"]	2026-10-13 13:50:34	2026-12-12 13:50:33	2026-10-13 13:50:33	2026-10-13 13:50:34
54	App\\Models\\User	12	mobile	20ca7151dc33fd42c919be9668e7555896dfa5dd1dd74a8d4c55fc1604ba581e	["*"]	2026-10-13 13:50:39	2026-12-12 13:50:39	2026-10-13 13:50:39	2026-10-13 13:50:39
55	App\\Models\\User	12	mobile	92b035cc6af42e7dec3dba2cd55c9d1c4996c257ec00d23fd6c6bff3ee60bb24	["*"]	2026-10-13 13:50:45	2026-12-12 13:50:45	2026-10-13 13:50:45	2026-10-13 13:50:45
69	App\\Models\\User	12	mobile	ecedfd13e878faa9d46db35cec1578c4c266ccf55950394a269716ac945a68c4	["*"]	2026-10-13 14:14:56	2026-12-12 14:14:49	2026-10-13 14:14:49	2026-10-13 14:14:56
56	App\\Models\\User	12	mobile	4e1b2d6131468a38e36fd96df87b657fc3b1921efd8431b134ed7f63f3df089d	["*"]	2026-10-13 13:51:57	2026-12-12 13:51:56	2026-10-13 13:51:56	2026-10-13 13:51:57
70	App\\Models\\User	12	mobile	0dc296b340fb02673e81516d12d48b323d010abab66a08b29e438f9b60366a28	["*"]	2026-10-13 14:15:09	2026-12-12 14:15:02	2026-10-13 14:15:02	2026-10-13 14:15:09
57	App\\Models\\User	12	mobile	af2dadfe1a8ab06126d856f3e01a3c69413f37ab04ae36c7728d5076e9a909ed	["*"]	2026-10-13 13:52:03	2026-12-12 13:52:03	2026-10-13 13:52:03	2026-10-13 13:52:03
58	App\\Models\\User	12	mobile	70414d179dbc89a22a01b89b1745ed3f3b70cb8565056aa1f7ca4dde40f1a3a7	["*"]	2026-10-13 13:52:20	2026-12-12 13:52:09	2026-10-13 13:52:09	2026-10-13 13:52:20
59	App\\Models\\User	12	mobile	aaef23ccf87bfe3c688b79690bd42706ba3f86f9d3bef63f42e76294a60bf551	["*"]	2026-10-13 13:52:20	2026-12-12 13:52:20	2026-10-13 13:52:20	2026-10-13 13:52:20
60	App\\Models\\User	12	mobile	3c68a9ec6d7ddd3c013561c503b139a104c133b3a8fa141d1443ba971f7b32a3	["*"]	2026-10-13 13:52:26	2026-12-12 13:52:26	2026-10-13 13:52:26	2026-10-13 13:52:26
61	App\\Models\\User	12	mobile	859e754076daedd637b21471cc6590e7638de3a29f8f9897f166aa9d30a15a11	["*"]	2026-10-13 13:52:32	2026-12-12 13:52:32	2026-10-13 13:52:32	2026-10-13 13:52:32
71	App\\Models\\User	12	mobile	7de0ddd9beb58d52a5edc4deb5cbba398f9ffea9d71edc4b14a95b6d6d15d926	["*"]	2026-10-13 14:15:15	2026-12-12 14:15:15	2026-10-13 14:15:15	2026-10-13 14:15:15
62	App\\Models\\User	12	mobile	59ecae4a80d652db4d62c5eb62a230caf967c3f31e9d1f42a942054d7cd63c7b	["*"]	2026-10-13 13:52:58	2026-12-12 13:52:47	2026-10-13 13:52:47	2026-10-13 13:52:58
63	App\\Models\\User	12	mobile	425b1a59b92124384267a4eb936eb633f785239d529620221a838f163e0dc17a	["*"]	2026-10-13 13:53:08	2026-12-12 13:53:08	2026-10-13 13:53:08	2026-10-13 13:53:08
72	App\\Models\\User	12	mobile	9b545ad27cde01d1911eaa708ba5cea4b587238f1e6e42cab9f09e31e40f7f57	["*"]	2026-10-13 14:15:19	2026-12-12 14:15:19	2026-10-13 14:15:19	2026-10-13 14:15:19
73	App\\Models\\User	12	mobile	d319fffe81737b005b5662c6567b0a1f8adb2e8080ae1b232e5e02f7ad6c0c3e	["*"]	2026-10-13 14:15:27	2026-12-12 14:15:27	2026-10-13 14:15:27	2026-10-13 14:15:27
64	App\\Models\\User	12	mobile	8fc70d950cd5514fe148654a89793496d13e9e98bdc04909a1a92c646a983f89	["*"]	2026-10-13 13:53:37	2026-12-12 13:53:32	2026-10-13 13:53:32	2026-10-13 13:53:37
74	App\\Models\\User	12	mobile	380b4a513033ad0e7eb45dd6f40c56487d658fff962a5b6a1fc6b9c5bf182949	["*"]	2026-10-13 14:15:31	2026-12-12 14:15:31	2026-10-13 14:15:31	2026-10-13 14:15:31
76	App\\Models\\User	12	mobile	3849118bdb67a6b878e3ceb867b4709ed13012dc958f2961c0a3f74e6ba41dc1	["*"]	2026-10-13 14:15:49	2026-12-12 14:15:49	2026-10-13 14:15:49	2026-10-13 14:15:49
77	App\\Models\\User	12	mobile	b2100a9267b6eb87a8619a67fe0d7287090e77fe7abc54280c0b2ebb4af0f1bc	["*"]	2026-10-13 14:15:56	2026-12-12 14:15:56	2026-10-13 14:15:56	2026-10-13 14:15:56
65	App\\Models\\User	12	mobile	578bc2584581788daed7a038f88c18207c9edfe85d21c393ee7c6d3a59938f72	["*"]	2026-10-13 14:07:56	2026-12-12 14:07:55	2026-10-13 14:07:55	2026-10-13 14:07:56
66	App\\Models\\User	12	mobile	7975f4c5b2bcc745b14c588931d61c339e1b9492d9ffd29480501780cc882136	["*"]	2026-10-13 14:08:10	2026-12-12 14:08:10	2026-10-13 14:08:10	2026-10-13 14:08:10
81	App\\Models\\User	12	mobile	8cbd099404f4b65c3d557f96d4616f77de63447d4e4469a252e230ddca318258	["*"]	2026-10-13 14:18:16	2026-12-12 14:18:09	2026-10-13 14:18:09	2026-10-13 14:18:16
78	App\\Models\\User	12	mobile	f2bd769839ce30a1ffa3819caa53217a643c37f27048f697ecd0b8e1d205029b	["*"]	2026-10-13 14:16:11	2026-12-12 14:16:04	2026-10-13 14:16:04	2026-10-13 14:16:11
67	App\\Models\\User	12	mobile	f30ff322a1f976ddbae1228aa8af5282b5ec092cc37bfb3eea7b4162ec1bf07b	["*"]	2026-10-13 14:14:34	2026-12-12 14:14:33	2026-10-13 14:14:33	2026-10-13 14:14:34
75	App\\Models\\User	12	mobile	f484037aab1cceccb76c9eec052939a08479650513b9e70d477a3b17d125a00a	["*"]	2026-10-13 14:15:43	2026-12-12 14:15:39	2026-10-13 14:15:39	2026-10-13 14:15:43
68	App\\Models\\User	12	mobile	320573ac26ac1070fff9d9e05c6db1f31fbb51c29a805aa0fcaea23f9c1c511b	["*"]	2026-10-13 14:14:46	2026-12-12 14:14:39	2026-10-13 14:14:39	2026-10-13 14:14:46
85	App\\Models\\User	12	mobile	cac7a4f7b7b1b2ead3be015c690a0e39c985c9e12315a47f6e387b2771306dd4	["*"]	2026-10-13 14:18:55	2026-12-12 14:18:55	2026-10-13 14:18:55	2026-10-13 14:18:55
79	App\\Models\\User	12	mobile	15645fdc012dc2261768fae6d5a636c0dd79f05c20eb5879366db93436f2c8a0	["*"]	2026-10-13 14:17:54	2026-12-12 14:17:53	2026-10-13 14:17:53	2026-10-13 14:17:54
82	App\\Models\\User	12	mobile	e74e4027964aa2e2dc56fd6a37c7fbb1e0d3486ee6f6aa5417a7d3aa6ed7bd50	["*"]	2026-10-13 14:18:33	2026-12-12 14:18:25	2026-10-13 14:18:25	2026-10-13 14:18:33
80	App\\Models\\User	12	mobile	0688ce777b87726c665d1d4d0faa5c08e9dd5eb38f5890071e6b20f1f388aa5f	["*"]	2026-10-13 14:18:06	2026-12-12 14:17:58	2026-10-13 14:17:58	2026-10-13 14:18:06
83	App\\Models\\User	12	mobile	bee6fde2c1d84fc562d875bf3ba3d71e258087405091c9c93cc4a8b31a40aa9d	["*"]	2026-10-13 14:18:41	2026-12-12 14:18:41	2026-10-13 14:18:41	2026-10-13 14:18:41
84	App\\Models\\User	12	mobile	67168fdc8f8769879ec7d11c468917efbf07611b9372cadd8bef36fe93d7cd4e	["*"]	2026-10-13 14:18:45	2026-12-12 14:18:45	2026-10-13 14:18:45	2026-10-13 14:18:45
86	App\\Models\\User	12	mobile	e108d46bbb916efdf39d7a10bb41f6312af006f7bec39c0e9e9b28585f793d56	["*"]	2026-10-13 14:18:59	2026-12-12 14:18:59	2026-10-13 14:18:59	2026-10-13 14:18:59
88	App\\Models\\User	12	mobile	7b504fa4cc047afb1252452e8b0163b2c4ad35895ee30e6e89813e707926b33e	["*"]	2026-10-13 14:19:26	2026-12-12 14:19:19	2026-10-13 14:19:19	2026-10-13 14:19:26
87	App\\Models\\User	12	mobile	6bcfe2502fec1fbe325c24c1a483fd36268c474f27c19bf34d80bc9762813c45	["*"]	2026-10-13 14:19:13	2026-12-12 14:19:09	2026-10-13 14:19:09	2026-10-13 14:19:13
89	App\\Models\\User	12	mobile	84cb09c1f79183c267d4e84ffeb43f8e70f0faecc79ded849aadb5bd9b2eebfb	["*"]	2026-10-13 14:19:36	2026-12-12 14:19:28	2026-10-13 14:19:28	2026-10-13 14:19:36
91	App\\Models\\User	12	mobile	c6adab71231710d96b0577979616ceadcb09b58750108a90c0a09a0c6d6eca14	["*"]	2026-10-13 14:19:43	2026-12-12 14:19:43	2026-10-13 14:19:43	2026-10-13 14:19:43
90	App\\Models\\User	12	mobile	a2242bb9487a41c81d9db19af3e6dac4c8b42270444a17f5896970a1268b0d40	["*"]	2026-10-13 14:19:39	2026-12-12 14:19:38	2026-10-13 14:19:38	2026-10-13 14:19:39
92	App\\Models\\User	12	mobile	f1a29ef2f740cb77559046de6849f7f5ee3841d1d1bf025c2bafd4cdc3720dc7	["*"]	2026-10-13 14:19:47	2026-12-12 14:19:47	2026-10-13 14:19:47	2026-10-13 14:19:47
93	App\\Models\\User	12	mobile	515e479b77dfd757234f12816820dbac27be1c65f918a1573b444e7adfd03e7f	["*"]	2026-10-13 14:19:51	2026-12-12 14:19:51	2026-10-13 14:19:51	2026-10-13 14:19:51
94	App\\Models\\User	12	mobile	831790c0d8e74d127a813880b6a961194e7d3629014008e9eede8c8975a18373	["*"]	2026-10-13 14:19:55	2026-12-12 14:19:55	2026-10-13 14:19:55	2026-10-13 14:19:55
95	App\\Models\\User	12	mobile	4d2abedbf35763e56e17f610738cb5f8dd00d06fa6e443c44349918311239046	["*"]	2026-10-13 14:20:00	2026-12-12 14:19:59	2026-10-13 14:19:59	2026-10-13 14:20:00
111	App\\Models\\User	12	mobile	4b5496ed33bbf3cb2dbc78ed34bbab3e1e1c897e8166b4bcdf41f676c11af525	["*"]	2026-10-13 14:24:03	2026-12-12 14:24:02	2026-10-13 14:24:02	2026-10-13 14:24:03
96	App\\Models\\User	12	mobile	cb19b64e9d728e9f266a90ad864b14aac52d2026a51862858905c628a6414091	["*"]	2026-10-13 14:20:11	2026-12-12 14:20:04	2026-10-13 14:20:04	2026-10-13 14:20:11
97	App\\Models\\User	12	mobile	21af542783c74a81f41e884ad75e37b778810df2d3434bb23b0d07b69d7f8984	["*"]	2026-10-13 14:22:07	2026-12-12 14:22:06	2026-10-13 14:22:06	2026-10-13 14:22:07
112	App\\Models\\User	12	mobile	a83f1fc4fd2634c2e6ce03b8a0b159d6b6b8bb225c8502d1da7601e5250a9b96	["*"]	2026-10-13 14:24:12	2026-12-12 14:24:12	2026-10-13 14:24:12	2026-10-13 14:24:12
98	App\\Models\\User	12	mobile	51459a7ae5f820283a2fdde1ee327577d51660b94a639eebe5d35bb3ae1fda9e	["*"]	2026-10-13 14:22:19	2026-12-12 14:22:11	2026-10-13 14:22:11	2026-10-13 14:22:19
99	App\\Models\\User	12	mobile	6f4f0c786cef983f4020a900974d66d43cb071d9fc07ea03e75e1cdb486bacca	["*"]	2026-10-13 14:22:28	2026-12-12 14:22:21	2026-10-13 14:22:21	2026-10-13 14:22:28
113	App\\Models\\User	12	mobile	9a8d17ccd01e3a5f747168f149b689f474f770d8c03d79a91f3edfae05cee779	["*"]	2026-10-13 14:24:16	2026-12-12 14:24:16	2026-10-13 14:24:16	2026-10-13 14:24:16
100	App\\Models\\User	12	mobile	4d0f4d6134058f2767ac9b049a7ccedbf1697cfd21f6d7d720914290a7acecd7	["*"]	2026-10-13 14:22:45	2026-12-12 14:22:37	2026-10-13 14:22:37	2026-10-13 14:22:45
101	App\\Models\\User	12	mobile	aaabbb0fb4b8a1cd1e2c2874dec2d976a8ea32a87aef0b0d0b0cef78b287e711	["*"]	2026-10-13 14:22:53	2026-12-12 14:22:53	2026-10-13 14:22:53	2026-10-13 14:22:53
102	App\\Models\\User	12	mobile	24d24921454d9d262bc9e860980d68db3eb25dfb9a0e9ccd0a182b68ea2516cf	["*"]	2026-10-13 14:22:57	2026-12-12 14:22:57	2026-10-13 14:22:57	2026-10-13 14:22:57
103	App\\Models\\User	12	mobile	d6e8d20d6bef03a6b300dca4d50acf8aadd38d5999e923bc8ef4d88eb4ca430c	["*"]	2026-10-13 14:23:07	2026-12-12 14:23:07	2026-10-13 14:23:07	2026-10-13 14:23:07
104	App\\Models\\User	12	mobile	2e6545d4b54f9d6f662058c7cd07c2fd5b38b7a5edcfb29a0540dbd21ef8cb1b	["*"]	2026-10-13 14:23:11	2026-12-12 14:23:11	2026-10-13 14:23:11	2026-10-13 14:23:11
105	App\\Models\\User	12	mobile	5bf8e941a9aa5d9973d940354157c387c35f6813f96319e30928716346538ad2	["*"]	2026-10-13 14:23:24	2026-12-12 14:23:20	2026-10-13 14:23:20	2026-10-13 14:23:24
114	App\\Models\\User	12	mobile	7fbff88891e5c11cc9bbd4ffb7c7e5052830b435c11c0f804061e7e2c5f9f47a	["*"]	2026-10-13 14:24:20	2026-12-12 14:24:20	2026-10-13 14:24:20	2026-10-13 14:24:20
106	App\\Models\\User	12	mobile	7cd7be2749c552c5e51380c8fa64e9b7cc7c053d40142e8592021bfc32a5cc1d	["*"]	2026-10-13 14:23:37	2026-12-12 14:23:30	2026-10-13 14:23:30	2026-10-13 14:23:37
122	App\\Models\\User	12	mobile	9816338d9c9cd0c1b451e055a885184d33b3093f79237608efa541bae0505173	["*"]	2026-10-13 14:43:02	2026-12-12 14:43:01	2026-10-13 14:43:01	2026-10-13 14:43:02
107	App\\Models\\User	12	mobile	41410afa0a70bfc3a710df71e68539658e8afbae8addbda576b02faf2f831415	["*"]	2026-10-13 14:23:47	2026-12-12 14:23:40	2026-10-13 14:23:40	2026-10-13 14:23:47
108	App\\Models\\User	12	mobile	469248d3e0b3d5d543e6c9ffef50c8ad456b878775dad431886b679b22557514	["*"]	2026-10-13 14:23:50	2026-12-12 14:23:50	2026-10-13 14:23:50	2026-10-13 14:23:50
109	App\\Models\\User	12	mobile	37100514a0e7cab0778aae42009a21129a0216495ffc16e458355750f9dc1011	["*"]	2026-10-13 14:23:54	2026-12-12 14:23:54	2026-10-13 14:23:54	2026-10-13 14:23:54
110	App\\Models\\User	12	mobile	492d7502e7538d2b5d5cba72aca62a18102db866bcc0edb848a6130d800ba093	["*"]	2026-10-13 14:23:58	2026-12-12 14:23:58	2026-10-13 14:23:58	2026-10-13 14:23:58
115	App\\Models\\User	12	mobile	570407de80082c40038754721fbb19b2c7d5960789b9fffe1d39bb462745f1b3	["*"]	2026-10-13 14:24:25	2026-12-12 14:24:24	2026-10-13 14:24:24	2026-10-13 14:24:25
116	App\\Models\\User	12	mobile	57516d5eaee88f4d393f80710f6884548e19a6914392b6849781a9a00dcd6014	["*"]	2026-10-13 14:24:36	2026-12-12 14:24:29	2026-10-13 14:24:29	2026-10-13 14:24:36
126	App\\Models\\User	12	mobile	3691da003943acfcbdaa761b35ee45256fef61bf13701fadd337aa898fa37299	["*"]	2026-10-13 14:43:25	2026-12-12 14:43:25	2026-10-13 14:43:25	2026-10-13 14:43:25
118	App\\Models\\User	12	mobile	2d2af9be72ccd76d7bfbb52761f83ab577e5b162822b020e7d7a42fed0a604ea	["*"]	2026-10-13 14:37:10	2026-12-12 14:37:10	2026-10-13 14:37:10	2026-10-13 14:37:10
119	App\\Models\\User	12	mobile	cc0a2cf034a37e89aedd1ef87d45893245babd6b0ecd646292a9847285cde611	["*"]	2026-10-13 14:37:14	2026-12-12 14:37:14	2026-10-13 14:37:14	2026-10-13 14:37:14
123	App\\Models\\User	12	mobile	7842b387d420b3935809904220fa9c66675631701311d100d36343c287a5c137	["*"]	2026-10-13 14:43:08	2026-12-12 14:43:08	2026-10-13 14:43:08	2026-10-13 14:43:08
124	App\\Models\\User	12	mobile	605948c5e87fe3c75982ae5e17b4aaee2dc3ffb141f665006239551a5208c2e4	["*"]	2026-10-13 14:43:14	2026-12-12 14:43:14	2026-10-13 14:43:14	2026-10-13 14:43:14
120	App\\Models\\User	13	mobile	2d740044cc8fcf36dc1e0bf758d721c2147cc7df4b2cad31f2dda26da4eca9d3	["*"]	2026-10-13 14:37:19	2026-12-12 14:37:18	2026-10-13 14:37:18	2026-10-13 14:37:19
125	App\\Models\\User	12	mobile	f759af7dc950d527335c5ea62889d7b1fa5ec5341580ee1b122f241c7192138a	["*"]	2026-10-13 14:43:20	2026-12-12 14:43:20	2026-10-13 14:43:20	2026-10-13 14:43:20
121	App\\Models\\User	12	mobile	28bb1d36131a33b1b3f74c38b34415c89cabcf4ca40605a15553d105b96b49f1	["*"]	2026-10-13 14:37:23	2026-12-12 14:37:22	2026-10-13 14:37:22	2026-10-13 14:37:23
21	App\\Models\\User	18	mobile	e627f46dc2b4f203f577be646a06bab0f907b91d24b3dcbbf93a4f59819066f6	["*"]	2026-10-13 16:54:34	2026-12-12 13:20:57	2026-10-13 13:20:57	2026-10-13 16:54:34
117	App\\Models\\User	18	api	396c04779d32bd7e1d20106a04eee4fc931dccc279d7fccd04a693eb9ca3b4fb	["*"]	2026-10-13 15:21:12	\N	2026-10-13 14:33:05	2026-10-13 15:21:12
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.profiles (id, user_id, profile_image, bio, location, created_at, updated_at) FROM stdin;
1	8	\N	\N	\N	2026-10-13 09:29:53	2026-10-13 09:29:53
5	12	\N	\N	\N	2026-10-13 09:30:50	2026-10-13 09:30:50
6	13	\N	\N	\N	2026-10-13 09:30:50	2026-10-13 09:30:50
7	14	\N	\N	\N	2026-10-13 09:30:50	2026-10-13 09:30:50
8	15	\N	\N	\N	2026-10-13 09:30:50	2026-10-13 09:30:50
9	16	\N	\N	\N	2026-10-13 09:30:50	2026-10-13 09:30:50
10	17	\N	\N	\N	2026-10-13 10:05:31	2026-10-13 10:05:31
11	18	\N	\N	\N	2026-10-13 11:06:22	2026-10-13 11:06:22
12	19	\N	\N	\N	2026-10-13 13:15:26	2026-10-13 13:15:26
\.


--
-- Data for Name: rent_payments; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.rent_payments (id, tenancy_id, amount, paid_on, method, note, created_at, updated_at) FROM stdin;
20	6	850000.00	2026-10-05	mobile	\N	2026-10-13 14:08:09	2026-10-13 14:08:09
21	6	850000.00	2026-09-05	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
22	6	850000.00	2026-08-05	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
23	6	850000.00	2026-07-05	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
24	6	850000.00	2026-06-05	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
25	6	850000.00	2026-05-05	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
26	7	520000.00	2026-09-06	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
27	7	520000.00	2026-08-06	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
28	7	520000.00	2026-07-06	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
29	8	750000.00	2026-10-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
30	8	750000.00	2026-09-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
31	8	750000.00	2026-08-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
32	8	750000.00	2026-07-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
33	8	750000.00	2026-06-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
34	8	750000.00	2026-05-03	cash	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
35	9	600000.00	2026-10-04	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
36	9	600000.00	2026-09-04	mobile	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
37	10	400000.00	2026-07-05	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
38	10	400000.00	2026-06-05	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
39	10	400000.00	2026-05-05	bank	\N	2026-10-13 14:08:10	2026-10-13 14:08:10
\.


--
-- Data for Name: tenancies; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.tenancies (id, house_id, user_id, name, phone, email, unit, monthly_rent, starts_on, ends_on, status, created_at, updated_at) FROM stdin;
6	14	14	Amina Said	+255700000003	tenant@demo.test	A2	850000.00	2026-01-12	\N	active	2026-10-13 14:08:09	2026-10-13 14:08:09
7	17	15	Baraka Mrema	+255700000004	baraka@demo.test	5C	520000.00	2026-06-12	\N	active	2026-10-13 14:08:10	2026-10-13 14:08:10
8	21	\N	Joseph Kasele	+255713555010	\N	No. 3	750000.00	2025-08-12	\N	active	2026-10-13 14:08:10	2026-10-13 14:08:10
9	22	\N	Grace Ndahmo	+255754555021	\N	\N	600000.00	2026-08-12	\N	active	2026-10-13 14:08:10	2026-10-13 14:08:10
10	19	16	Rehema Kimaro	+255700000005	rehema@demo.test	\N	400000.00	2025-10-12	2026-07-01	ended	2026-10-13 14:08:10	2026-10-13 14:08:10
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.units (id, house_id, unit_number, status, monthly_rent, created_at, updated_at, unit_type, payment_terms, bedrooms, bathrooms, image_path, description) FROM stdin;
11	13	U1	available	3200000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
12	14	U1	available	850000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
13	15	U1	available	180000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
14	16	U1	available	1400000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
15	17	U1	available	520000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
16	18	U1	available	2600000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
17	19	U1	available	400000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
18	20	U1	available	120000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
19	21	U1	available	750000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
20	22	U1	available	600000.00	2026-10-13 09:30:51	2026-10-13 09:30:51	\N	\N	1	1	\N	\N
26	23	Master Bedroom Suite 1	available	25000.00	2026-10-13 14:44:18	2026-10-13 14:44:18	Master Bedroom	4 months advance	1	1	houses/kimaro_master_bedroom.jpg	Spacious self-contained master bedroom with private en-suite bathroom, queen bed, split AC, built-in wardrobes, and private balcony view.
28	23	Standard Bedroom	available	10000.00	2026-10-13 14:44:18	2026-10-13 14:44:18	Standard Room	6 months advance	1	1	houses/kimaro_standard_room.jpg	Clean and bright standard bedroom with study desk, built-in wooden wardrobe, ceiling fan, and access to shared modern bathroom facilities.
30	23	Independent Full House Wing B	available	550000.00	2026-10-13 14:44:18	2026-10-13 14:44:18	3-Bedroom House	4 months advance	3	2	houses/kimaro_independent_wing_b.jpg	Complete independent 3-bedroom private residential wing with modern lounge, exposed beams, open kitchen bar island, dining room, private garden patio, and 3 bedrooms.
29	23	Independent Full House Wing A	available	550000.00	2026-10-13 14:44:18	2026-10-13 15:30:02	3-Bedroom House	4 months advance	3	2	houses/kimaro_living_room.jpg	Complete independent 3-bedroom private residential wing featuring open-plan living room, master en-suite bedroom, 2 secondary bedrooms, fitted kitchen, and private terrace.
27	23	Master Bedroom Suite 2	available	25000.00	2026-10-13 14:44:18	2026-10-13 16:44:31	Master Bedroom	4 months advance	1	1	houses/kimaro_master_bedroom_2.jpg	Luxury self-contained master bedroom with emerald accents, private glass-door bathroom, ceiling fan, wide tropical windows, and large closet.
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.users (id, uuid, fullname, email, phone, role, password, created_at, updated_at, suspended_at, country) FROM stdin;
8	55f683d3-b6b8-4f98-ace7-8b23cdbe234b	Panga Admin	admin@pangapangisha.co.tz	\N	admin	$2y$12$6/wYtngf6wwuWQp2BVph2eZkOjgVro/k9f0MEit7Y/wslnZHQH7Y2	2026-10-13 09:29:53	2026-10-13 11:06:07	\N	\N
12	11960204-1fac-4807-a02e-2240a7c32977	Neema Mushi	owner@demo.test	+255700000001	landlord	$2y$12$iLEvquiyyRfk5BhtQ.0OWOUlbh9LjqphSM1LFWiMqdzBBLPS3rz2S	2026-09-22 09:30:50	2026-10-13 09:30:50	\N	TZ
13	e4c582de-8aa5-4847-bf36-e48107046fb1	Juma Hassan	agent@demo.test	+255700000002	landlord	$2y$12$xblncwKUQb.oyliusvuTg.RYIKZ5W8qcLp27VbblDjmTaXUmYHu/O	2026-09-26 09:30:51	2026-10-13 09:30:51	\N	TZ
14	e01a6dd6-b087-4d00-8d27-80e94a048b4b	Amina Said	tenant@demo.test	+255700000003	renter	$2y$12$OA57faHUyCllYHwFVxdi0eIWvd3ZM9XMuMSur69KBt7h9JQB/RlO6	2026-10-01 09:30:51	2026-10-13 09:30:51	\N	TZ
16	f43577b8-8773-4470-8067-b1ecf986574b	Rehema Kimaro	rehema@demo.test	+255700000005	renter	$2y$12$MIGR/4jQmqNff2WXthhacOJrsVXiNEauwtzUy7BAhcBWP5c1yZEEm	2026-10-11 09:30:51	2026-10-13 09:30:51	\N	TZ
15	9942bd1f-57ac-4b0f-89f8-b3d7be36ecdd	Baraka Mrema	baraka@demo.test	+255700000004	renter	$2y$12$6DEsO2XqqT2qeV87RPK4VeW5g2OO40aDKB37KJkpmJCjZ0.nA/SCC	2026-10-08 09:30:51	2026-10-13 09:32:22	\N	TZ
17	5304c3ce-b690-4267-b3e1-95486faf7832	Salma Omari	newowner@demo.test	+255700000006	landlord	$2y$12$r8iUuToOutOGPWhCJztx5ulhiU0u86tzgOOBk9eUEy9VbZK5IXNBS	2026-10-13 10:05:31	2026-10-13 10:05:31	\N	TZ
19	6854747e-41b3-4070-b7d6-b8ce6bdff7b1	tamimu	tamimu@gmai.com	+25563887266	landlord	$2y$12$DWQUc4nqmDmz7Vikf.VaaOpwMK8969oqitM98Ux0Tni8RDQepNosS	2026-10-13 13:15:25	2026-10-13 13:15:25	\N	TZ
18	54593870-2f97-4459-b916-811f2d830348	ibrahim kimaro	ibrahimkimaro01@gmail.com	+255628736374	landlord	$2y$12$iyUZwU0IntSxiuvp0OrmzOLbfEqRphORUA1RFL.bp8oh0ETyJQci2	2026-10-13 11:06:22	2026-10-13 16:04:10	\N	TZ
\.


--
-- Data for Name: viewing_requests; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.viewing_requests (id, house_id, user_id, preferred_at, note, status, created_at, updated_at) FROM stdin;
1	13	14	2026-10-15 10:00:00+00	Saturday morning works best for me.	pending	2026-10-13 09:30:51	2026-10-13 09:30:51
2	15	15	2026-10-14 10:00:00+00	\N	accepted	2026-10-13 09:30:51	2026-10-13 09:30:51
3	18	16	2026-10-17 10:00:00+00	Can I bring my sister?	pending	2026-10-13 09:30:51	2026-10-13 09:30:51
4	13	18	2026-10-16 14:00:00+00	\N	pending	2026-10-13 14:46:20	2026-10-13 14:46:20
\.


--
-- Name: admin_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.admin_actions_id_seq', 36, true);


--
-- Name: ai_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.ai_settings_id_seq', 2, true);


--
-- Name: ai_usage_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.ai_usage_logs_id_seq', 29, true);


--
-- Name: business_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.business_profiles_id_seq', 2, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.conversations_id_seq', 3, true);


--
-- Name: device_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.device_tokens_id_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: house_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.house_images_id_seq', 42, true);


--
-- Name: houses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.houses_id_seq', 23, true);


--
-- Name: identity_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.identity_verifications_id_seq', 7, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: listing_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.listing_reports_id_seq', 3, true);


--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.maintenance_requests_id_seq', 8, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.migrations_id_seq', 16, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 126, true);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.profiles_id_seq', 12, true);


--
-- Name: rent_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.rent_payments_id_seq', 39, true);


--
-- Name: tenancies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.tenancies_id_seq', 10, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.units_id_seq', 30, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- Name: viewing_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.viewing_requests_id_seq', 4, true);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: agent_conversation_messages agent_conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.agent_conversation_messages
    ADD CONSTRAINT agent_conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: agent_conversations agent_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_settings ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_user_id_unique UNIQUE (user_id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_user_low_id_user_high_id_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_low_id_user_high_id_unique UNIQUE (user_low_id, user_high_id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_token_unique UNIQUE (token);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (user_id, house_id);


--
-- Name: house_images house_images_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.house_images
    ADD CONSTRAINT house_images_pkey PRIMARY KEY (id);


--
-- Name: houses houses_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.houses
    ADD CONSTRAINT houses_pkey PRIMARY KEY (id);


--
-- Name: identity_verifications identity_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: listing_reports listing_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.listing_reports
    ADD CONSTRAINT listing_reports_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


--
-- Name: rent_payments rent_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.rent_payments
    ADD CONSTRAINT rent_payments_pkey PRIMARY KEY (id);


--
-- Name: tenancies tenancies_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.tenancies
    ADD CONSTRAINT tenancies_pkey PRIMARY KEY (id);


--
-- Name: units units_house_id_unit_number_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_house_id_unit_number_unique UNIQUE (house_id, unit_number);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_unique UNIQUE (uuid);


--
-- Name: viewing_requests viewing_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.viewing_requests
    ADD CONSTRAINT viewing_requests_pkey PRIMARY KEY (id);


--
-- Name: admin_actions_subject_type_subject_id_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX admin_actions_subject_type_subject_id_index ON public.admin_actions USING btree (subject_type, subject_id);


--
-- Name: agent_conversation_messages_conversation_id_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX agent_conversation_messages_conversation_id_index ON public.agent_conversation_messages USING btree (conversation_id);


--
-- Name: ai_usage_logs_created_at_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ai_usage_logs_created_at_index ON public.ai_usage_logs USING btree (created_at);


--
-- Name: ai_usage_logs_feature_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ai_usage_logs_feature_index ON public.ai_usage_logs USING btree (feature);


--
-- Name: ai_usage_logs_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ai_usage_logs_status_index ON public.ai_usage_logs USING btree (status);


--
-- Name: business_profiles_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX business_profiles_status_index ON public.business_profiles USING btree (status);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: conversation_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX conversation_index ON public.agent_conversation_messages USING btree (conversation_id, participant_type, participant_id, updated_at);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: houses_district_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX houses_district_index ON public.houses USING btree (district);


--
-- Name: houses_property_type_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX houses_property_type_index ON public.houses USING btree (property_type);


--
-- Name: houses_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX houses_status_index ON public.houses USING btree (status);


--
-- Name: identity_verifications_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX identity_verifications_status_index ON public.identity_verifications USING btree (status);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: maintenance_requests_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX maintenance_requests_status_index ON public.maintenance_requests USING btree (status);


--
-- Name: notifications_notifiable_type_notifiable_id_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX notifications_notifiable_type_notifiable_id_index ON public.notifications USING btree (notifiable_type, notifiable_id);


--
-- Name: participant_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX participant_index ON public.agent_conversation_messages USING btree (participant_type, participant_id, agent);


--
-- Name: participant_updated_at_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX participant_updated_at_index ON public.agent_conversations USING btree (participant_type, participant_id, updated_at);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: rent_payments_paid_on_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX rent_payments_paid_on_index ON public.rent_payments USING btree (paid_on);


--
-- Name: tenancies_status_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX tenancies_status_index ON public.tenancies USING btree (status);


--
-- Name: users_country_index; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX users_country_index ON public.users USING btree (country);


--
-- Name: admin_actions admin_actions_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ai_usage_logs ai_usage_logs_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: business_profiles business_profiles_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: business_profiles business_profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_user_high_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_high_id_foreign FOREIGN KEY (user_high_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_low_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_low_id_foreign FOREIGN KEY (user_low_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: house_images house_images_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.house_images
    ADD CONSTRAINT house_images_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: houses houses_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.houses
    ADD CONSTRAINT houses_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: identity_verifications identity_verifications_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: identity_verifications identity_verifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_reports listing_reports_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.listing_reports
    ADD CONSTRAINT listing_reports_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: listing_reports listing_reports_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.listing_reports
    ADD CONSTRAINT listing_reports_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_tenancy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_tenancy_id_foreign FOREIGN KEY (tenancy_id) REFERENCES public.tenancies(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rent_payments rent_payments_tenancy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.rent_payments
    ADD CONSTRAINT rent_payments_tenancy_id_foreign FOREIGN KEY (tenancy_id) REFERENCES public.tenancies(id) ON DELETE CASCADE;


--
-- Name: tenancies tenancies_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.tenancies
    ADD CONSTRAINT tenancies_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: tenancies tenancies_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.tenancies
    ADD CONSTRAINT tenancies_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: units units_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: viewing_requests viewing_requests_house_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.viewing_requests
    ADD CONSTRAINT viewing_requests_house_id_foreign FOREIGN KEY (house_id) REFERENCES public.houses(id) ON DELETE CASCADE;


--
-- Name: viewing_requests viewing_requests_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.viewing_requests
    ADD CONSTRAINT viewing_requests_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NrZ7AFYNr0hwKm0xpJPPRgE4FNzDjz4EFqMwoPvvicvdZI6qBitTDImmyX11Aow

