#!/bin/sh
mkdir -p /app/data/pipeline-cache/frequency /app/data/tts-cache
chown -R 1001:1001 /app/data
exec su-exec nextjs node server.js
