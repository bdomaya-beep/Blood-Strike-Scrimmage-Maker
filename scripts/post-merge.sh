#!/bin/bash
set -e
npm ci
npm -w @workspace/db run push
