#!/bin/sh

cd /usr/share/nginx
npx prisma db push

cd /usr/share/nginx/backend
node main.js &

# Démarrer Nginx
nginx -g "daemon off;"
