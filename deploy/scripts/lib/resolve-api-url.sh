# shellcheck shell=bash
# Normalize API_URL from .env.production to the Nest /api/v1 base (used by deploy smoke scripts).
resolve_api_v1_url() {
  local url="${1:-http://localhost:3001}"
  url="${url%/}"
  case "$url" in
    */api/v1) printf '%s' "$url" ;;
    *) printf '%s/api/v1' "$url" ;;
  esac
}

resolve_api_origin() {
  local v1
  v1="$(resolve_api_v1_url "${1:-http://localhost:3001}")"
  if [[ "$v1" == */api/v1 ]]; then
    printf '%s' "${v1%/api/v1}"
  else
    printf '%s' "$v1"
  fi
}
