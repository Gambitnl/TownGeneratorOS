#!/bin/bash
cd web
npm install
npm run dev > ../dev_server.log 2>&1 &
