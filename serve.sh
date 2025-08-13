#!/bin/bash
cp web/index.html web/dist/index.html
npx http-server web/dist -p 8000 > server.log 2>&1 &
