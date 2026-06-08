#!/usr/bin/env bash
# AlmaLinux 10 — первичная установка «Сяки Мяки чат» на VPS
# Запуск: sudo bash deploy/setup-almalinux.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/eyedamort/syakiMyakiChat.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/syakiMyakiChat}"
WEB_PORT="${WEB_PORT:-80}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите от root: sudo bash $0"
  exit 1
fi

echo "==> Пакеты"
dnf install -y git curl dnf-plugins-core firewalld

echo "==> Swap (1 GB) — нужен для сборки на VPS с 1 GB RAM"
if ! swapon --show | grep -q '/swapfile'; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Docker"
if ! command -v docker &>/dev/null; then
  dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

echo "==> Firewalld: порт ${WEB_PORT}/tcp"
systemctl enable --now firewalld
firewall-cmd --permanent --add-port="${WEB_PORT}/tcp"
firewall-cmd --reload

echo "==> Клонирование репозитория"
if [[ -d "${INSTALL_DIR}/.git" ]]; then
  git -C "${INSTALL_DIR}" pull --ff-only
else
  git clone "${REPO_URL}" "${INSTALL_DIR}"
fi

cd "${INSTALL_DIR}"
cp -n .env.example .env
if grep -q '^WEB_PORT=' .env; then
  sed -i "s/^WEB_PORT=.*/WEB_PORT=${WEB_PORT}/" .env
else
  echo "WEB_PORT=${WEB_PORT}" >> .env
fi

echo "==> Сборка и запуск (может занять несколько минут)"
export DOCKER_BUILDKIT=1
docker compose up -d --build

echo ""
echo "Готово."
echo "  Локально:  curl http://127.0.0.1:${WEB_PORT}/health"
echo "  Снаружи:   http://$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):${WEB_PORT}/"
echo ""
docker compose ps
