#!/usr/bin/env bash
# SSH-ключ для GitHub Actions автодеплоя
# Запуск на сервере: sudo bash deploy/setup-github-deploy.sh
set -euo pipefail

KEY_PATH="/root/.ssh/github_deploy"
AUTH_KEYS="/root/.ssh/authorized_keys"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите от root"
  exit 1
fi

if [[ ! -f "${KEY_PATH}" ]]; then
  ssh-keygen -t ed25519 -f "${KEY_PATH}" -N "" -C "github-actions-deploy"
fi

PUB_KEY="$(cat "${KEY_PATH}.pub")"
if ! grep -qF "${PUB_KEY}" "${AUTH_KEYS}" 2>/dev/null; then
  mkdir -p /root/.ssh
  chmod 700 /root/.ssh
  echo "${PUB_KEY}" >> "${AUTH_KEYS}"
  chmod 600 "${AUTH_KEYS}"
fi

chmod +x /opt/syakiMyakiChat/deploy/deploy.sh 2>/dev/null || true

echo ""
echo "=== Добавьте секреты в GitHub (локально, где есть gh auth) ==="
echo ""
echo "gh secret set SSH_HOST --body \"$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')\" --repo eyedamort/syakiMyakiChat"
echo "gh secret set SSH_USER --body \"root\" --repo eyedamort/syakiMyakiChat"
echo "gh secret set SSH_PRIVATE_KEY --repo eyedamort/syakiMyakiChat < \"${KEY_PATH}\""
echo ""
