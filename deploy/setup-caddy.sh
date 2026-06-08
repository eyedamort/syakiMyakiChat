#!/usr/bin/env bash
# HTTPS через Caddy (Let's Encrypt) перед docker compose
# Запуск: sudo bash deploy/setup-caddy.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/syakiMyakiChat}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите от root: sudo bash $0"
  exit 1
fi

echo "==> Docker: порт 80 (HTTP)"
cd "${INSTALL_DIR}"
echo "WEB_PORT=80" > .env
docker compose up -d

echo "==> Caddy"
if ! command -v caddy &>/dev/null; then
  dnf install -y 'dnf-command(copr)'
  dnf copr enable -y @caddy/caddy
  dnf install -y caddy
fi

cp "${INSTALL_DIR}/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy

echo "==> Firewalld"
firewall-cmd --permanent --add-service=http 2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo ""
echo "Готово: https://syakimyaki.ru"
curl -skI https://syakimyaki.ru | head -5 || true
