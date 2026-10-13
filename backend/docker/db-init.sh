#!/bin/sh
# Runs once on first start: the chat engine gets its own database next to Django's.
set -e
createdb -U "$POSTGRES_USER" realtime_chat_db
psql -U "$POSTGRES_USER" -d realtime_chat_db -v ON_ERROR_STOP=1 -f /schema/chat.sql
