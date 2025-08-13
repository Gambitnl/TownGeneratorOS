#!/bin/bash
cd web
yarn install
yarn dev > ../dev_server.log 2>&1 &
