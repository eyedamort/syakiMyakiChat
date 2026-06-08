#!/usr/bin/env bash
# Автодеплой: git pull + пересборка контейнеров
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/syakiMyakiChat}"
BRANCH="${BRANCH:-main}"

cd "${INSTALL_DIR}"

git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"

docker compose up -d --build

docker compose ps
