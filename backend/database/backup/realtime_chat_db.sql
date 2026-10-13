--
-- PostgreSQL database dump
--

\restrict Q4gilUdks43Cp2MfqtwIFynykGudfBw0oDncVVwNX3L8izdhPmKqZeIdJvUBU91

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

ALTER TABLE IF EXISTS ONLY public.uploads DROP CONSTRAINT IF EXISTS uploads_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.discussion_members DROP CONSTRAINT IF EXISTS discussion_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.discussion_members DROP CONSTRAINT IF EXISTS discussion_members_discussion_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS chat_groups_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_invited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_group_id_fkey;
DROP INDEX IF EXISTS public.uq_notifications_unread_message;
DROP INDEX IF EXISTS public.ix_uploads_name_owner;
DROP INDEX IF EXISTS public.ix_notifications_user_kind_link;
DROP INDEX IF EXISTS public.ix_chat_messages_unread;
DROP INDEX IF EXISTS public.ix_chat_messages_topic_id;
DROP INDEX IF EXISTS public.ix_chat_messages_topic_attachment;
DROP INDEX IF EXISTS public.ix_chat_group_members_user;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS uq_chat_messages_author_client;
ALTER TABLE IF EXISTS ONLY public.uploads DROP CONSTRAINT IF EXISTS uploads_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.discussions DROP CONSTRAINT IF EXISTS discussions_pkey;
ALTER TABLE IF EXISTS ONLY public.discussion_members DROP CONSTRAINT IF EXISTS discussion_members_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS chat_groups_slug_key;
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS chat_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_clears DROP CONSTRAINT IF EXISTS chat_clears_pkey;
ALTER TABLE IF EXISTS public.chat_messages ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.uploads;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.discussions;
DROP TABLE IF EXISTS public.discussion_members;
DROP SEQUENCE IF EXISTS public.chat_messages_id_seq;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_groups;
DROP TABLE IF EXISTS public.chat_group_members;
DROP TABLE IF EXISTS public.chat_clears;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_clears; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.chat_clears (
    user_id uuid NOT NULL,
    topic character varying(200) NOT NULL,
    up_to bigint NOT NULL,
    cleared_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_clears OWNER TO panga;

--
-- Name: chat_group_members; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.chat_group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(10) DEFAULT 'member'::character varying NOT NULL,
    status character varying(10) DEFAULT 'invited'::character varying NOT NULL,
    invited_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    joined_at timestamp with time zone
);


ALTER TABLE public.chat_group_members OWNER TO panga;

--
-- Name: chat_groups; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.chat_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    slug character varying(64) NOT NULL,
    name character varying(120) NOT NULL,
    topic character varying(200) DEFAULT ''::character varying NOT NULL,
    avatar_url character varying(300),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_groups OWNER TO panga;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.chat_messages (
    id bigint NOT NULL,
    client_id character varying(64) NOT NULL,
    topic character varying(200) NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(255) NOT NULL,
    author_username character varying(50) NOT NULL,
    body text NOT NULL,
    reply_to jsonb,
    recipient_id uuid,
    read_at timestamp with time zone,
    attachment jsonb,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO panga;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: panga
--

CREATE SEQUENCE public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO panga;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: panga
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: discussion_members; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.discussion_members (
    discussion_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'member'::character varying NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL
);


ALTER TABLE public.discussion_members OWNER TO panga;

--
-- Name: discussions; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.discussions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    live_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discussions OWNER TO panga;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    kind character varying(50) NOT NULL,
    title character varying(255),
    body character varying(300),
    link character varying(255),
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO panga;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    avatar_url character varying(500),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO panga;

--
-- Name: uploads; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.uploads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    owner_id uuid NOT NULL,
    content_type character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.uploads OWNER TO panga;

--
-- Name: users; Type: TABLE; Schema: public; Owner: panga
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255),
    username character varying(50),
    full_name character varying(255),
    is_admin boolean DEFAULT false NOT NULL,
    otp_pending boolean DEFAULT false NOT NULL,
    activation_deadline timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO panga;

--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Data for Name: chat_clears; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.chat_clears (user_id, topic, up_to, cleared_at) FROM stdin;
\.


--
-- Data for Name: chat_group_members; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.chat_group_members (group_id, user_id, role, status, invited_by, created_at, joined_at) FROM stdin;
7be62979-6452-473e-acf6-a8c0e2ef3941	e01a6dd6-b087-4d00-8d27-80e94a048b4b	admin	member	e01a6dd6-b087-4d00-8d27-80e94a048b4b	2026-10-13 13:29:18.254317+00	2026-10-13 13:29:18.254317+00
7be62979-6452-473e-acf6-a8c0e2ef3941	11960204-1fac-4807-a02e-2240a7c32977	member	member	e01a6dd6-b087-4d00-8d27-80e94a048b4b	2026-10-13 13:29:18.254317+00	2026-10-13 13:29:18.254317+00
7be62979-6452-473e-acf6-a8c0e2ef3941	e4c582de-8aa5-4847-bf36-e48107046fb1	member	member	e01a6dd6-b087-4d00-8d27-80e94a048b4b	2026-10-13 13:29:18.254317+00	2026-10-13 13:29:18.254317+00
\.


--
-- Data for Name: chat_groups; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.chat_groups (id, slug, name, topic, avatar_url, created_by, created_at) FROM stdin;
7be62979-6452-473e-acf6-a8c0e2ef3941	g-11fzvnnuepxz3pgtekurbjrh	Viewing on Saturday		\N	e01a6dd6-b087-4d00-8d27-80e94a048b4b	2026-10-13 13:29:18.254317+00
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.chat_messages (id, client_id, topic, author_id, author_name, author_username, body, reply_to, recipient_id, read_at, attachment, edited_at, deleted_at, inserted_at) FROM stdin;
1	c1	direct:62967995-667b-46e7-894c-23bf7e1e12d3_b97968eb-8a90-435a-b0f7-c00927c68d99	b97968eb-8a90-435a-b0f7-c00927c68d99	Alice Landlord	+255711000001	Habari Bob, chumba bado kipo?	\N	62967995-667b-46e7-894c-23bf7e1e12d3	\N	\N	\N	\N	2026-10-12 12:55:40.358693+00
2	1791828484311002-767103207	direct:1a46f185-9819-48e1-8151-a4afc8f5f798_ac358af4-e9f3-4138-8918-a3cadc9db2e5	ac358af4-e9f3-4138-8918-a3cadc9db2e5	Amina Said	+255700000003	Habari	\N	1a46f185-9819-48e1-8151-a4afc8f5f798	\N	\N	\N	\N	2026-10-12 18:08:05.786045+00
3	probe-1791896488275922	direct:11960204-1fac-4807-a02e-2240a7c32977_e01a6dd6-b087-4d00-8d27-80e94a048b4b	11960204-1fac-4807-a02e-2240a7c32977	Neema Mushi	+255700000001	Karibu, nyumba bado ipo. Unaweza kuja Jumamosi?	\N	e01a6dd6-b087-4d00-8d27-80e94a048b4b	2026-10-13 13:01:29.111534+00	\N	\N	\N	2026-10-13 13:01:28.384729+00
4	probe-1791896488275922-2	direct:11960204-1fac-4807-a02e-2240a7c32977_e01a6dd6-b087-4d00-8d27-80e94a048b4b	11960204-1fac-4807-a02e-2240a7c32977	Neema Mushi	+255700000001		\N	e01a6dd6-b087-4d00-8d27-80e94a048b4b	\N	\N	\N	2026-10-13 13:01:32.191355+00	2026-10-13 13:01:31.490886+00
5	g-1791898364744159	room:g-11fzvnnuepxz3pgtekurbjrh	e01a6dd6-b087-4d00-8d27-80e94a048b4b	Amina Said	+255700000003	Tukutane Jumamosi saa nne asubuhi?	\N	\N	\N	\N	\N	\N	2026-10-13 13:32:44.746092+00
6	1791898626366144-2131786151	direct:54593870-2f97-4459-b916-811f2d830348_e01a6dd6-b087-4d00-8d27-80e94a048b4b	54593870-2f97-4459-b916-811f2d830348	ibrahim kimaro	+255628736374	Hi how are you	\N	e01a6dd6-b087-4d00-8d27-80e94a048b4b	\N	\N	\N	\N	2026-10-13 13:37:06.783021+00
\.


--
-- Data for Name: discussion_members; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.discussion_members (discussion_id, user_id, status, role) FROM stdin;
\.


--
-- Data for Name: discussions; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.discussions (id, title, live_enabled, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.notifications (id, user_id, kind, title, body, link, read_at, created_at) FROM stdin;
154ca8ba-060b-4e31-9990-2d359fb6d327	62967995-667b-46e7-894c-23bf7e1e12d3	message	Alice Landlord sent you a message	Habari Bob, chumba bado kipo?	/chat?c=direct%3A62967995-667b-46e7-894c-23bf7e1e12d3_b97968eb-8a90-435a-b0f7-c00927c68d99	\N	2026-10-12 12:55:40.40907+00
56380fa7-7caf-4abf-8198-a1196131951a	1a46f185-9819-48e1-8151-a4afc8f5f798	message	Amina Said sent you a message	Habari	/chat?c=direct%3A1a46f185-9819-48e1-8151-a4afc8f5f798_ac358af4-e9f3-4138-8918-a3cadc9db2e5	\N	2026-10-12 18:08:06.930709+00
e56b5885-77be-4fa3-8d78-c711c8972e0a	e01a6dd6-b087-4d00-8d27-80e94a048b4b	message	Neema Mushi sent you a message	probe to delete	/chat?c=direct%3A11960204-1fac-4807-a02e-2240a7c32977_e01a6dd6-b087-4d00-8d27-80e94a048b4b	\N	2026-10-13 13:01:32.164044+00
32ebb1fd-5bcc-4cf2-bb51-a3cff98280d5	e01a6dd6-b087-4d00-8d27-80e94a048b4b	message	ibrahim kimaro sent you a message	Hi how are you	/chat?c=direct%3A54593870-2f97-4459-b916-811f2d830348_e01a6dd6-b087-4d00-8d27-80e94a048b4b	\N	2026-10-13 13:37:06.795013+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.profiles (user_id, avatar_url, updated_at) FROM stdin;
\.


--
-- Data for Name: uploads; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.uploads (id, name, owner_id, content_type, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: panga
--

COPY public.users (id, email, username, full_name, is_admin, otp_pending, activation_deadline, created_at) FROM stdin;
e01a6dd6-b087-4d00-8d27-80e94a048b4b	\N	\N	Amina Said	f	f	\N	2026-10-13 13:29:18.254317+00
11960204-1fac-4807-a02e-2240a7c32977	\N	\N	Neema Mushi	f	f	\N	2026-10-13 13:29:18.254317+00
e4c582de-8aa5-4847-bf36-e48107046fb1	\N	\N	Juma Hassan	f	f	\N	2026-10-13 13:29:18.254317+00
\.


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: panga
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 6, true);


--
-- Name: chat_clears chat_clears_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_clears
    ADD CONSTRAINT chat_clears_pkey PRIMARY KEY (user_id, topic);


--
-- Name: chat_group_members chat_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- Name: chat_groups chat_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_pkey PRIMARY KEY (id);


--
-- Name: chat_groups chat_groups_slug_key; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_slug_key UNIQUE (slug);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: discussion_members discussion_members_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.discussion_members
    ADD CONSTRAINT discussion_members_pkey PRIMARY KEY (discussion_id, user_id);


--
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: chat_messages uq_chat_messages_author_client; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT uq_chat_messages_author_client UNIQUE (author_id, client_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: ix_chat_group_members_user; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_chat_group_members_user ON public.chat_group_members USING btree (user_id, status);


--
-- Name: ix_chat_messages_topic_attachment; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_chat_messages_topic_attachment ON public.chat_messages USING btree (topic, id) WHERE (attachment IS NOT NULL);


--
-- Name: ix_chat_messages_topic_id; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_chat_messages_topic_id ON public.chat_messages USING btree (topic, id);


--
-- Name: ix_chat_messages_unread; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_chat_messages_unread ON public.chat_messages USING btree (recipient_id) WHERE (read_at IS NULL);


--
-- Name: ix_notifications_user_kind_link; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_notifications_user_kind_link ON public.notifications USING btree (user_id, kind, link);


--
-- Name: ix_uploads_name_owner; Type: INDEX; Schema: public; Owner: panga
--

CREATE INDEX ix_uploads_name_owner ON public.uploads USING btree (name, owner_id);


--
-- Name: uq_notifications_unread_message; Type: INDEX; Schema: public; Owner: panga
--

CREATE UNIQUE INDEX uq_notifications_unread_message ON public.notifications USING btree (user_id, link) WHERE (((kind)::text = 'message'::text) AND (read_at IS NULL));


--
-- Name: chat_group_members chat_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;


--
-- Name: chat_group_members chat_group_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_group_members chat_group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_groups chat_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: discussion_members discussion_members_discussion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.discussion_members
    ADD CONSTRAINT discussion_members_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id) ON DELETE CASCADE;


--
-- Name: discussion_members discussion_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.discussion_members
    ADD CONSTRAINT discussion_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: panga
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Q4gilUdks43Cp2MfqtwIFynykGudfBw0oDncVVwNX3L8izdhPmKqZeIdJvUBU91

