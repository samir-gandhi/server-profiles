#!/usr/bin/env sh
#
# Ping Identity DevOps - Docker Build Hooks

# shellcheck source=../../../../pingcommon/opt/staging/hooks/pingcommon.lib.sh
. "${HOOKS_DIR}/pingcommon.lib.sh"

_password=$(get_value PING_IDENTITY_PASSWORD true)
if test -z "${_password}"; then
  die_on_error 83 "bulk import file found, but no PING_IDENTITY_PASSWORD" || exit ${?}
fi

_out="/tmp/import.status.out"
_importBulkConfig=$(
    curl \
        --insecure \
        --silent \
        --write-out '%{http_code}' \
        --request POST \
        --user "${ROOT_USER}:${_password}" \
        --header 'Content-Type: application/json' \
        --header 'X-XSRF-Header: PingFederate' \
        --header 'X-BypassExternalValidation: true' \
        --data "@${BULK_CONFIG_DIR}/${BULK_CONFIG_FILE}" \
        --output "${_out}" \
        "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/bulk/import?failFast=false" \
        2>/dev/null
)

if test "${_importBulkConfig}" = "200"
then
  if test "${OPERATIONAL_MODE}" = "CLUSTERED_CONSOLE"
  then
    _out="/tmp/replicate.status.out"
    _importBulkConfig=$(
        curl \
            --insecure \
            --silent \
            --write-out '%{http_code}' \
            --request POST \
            --user "${ROOT_USER}:${_password}" \
            --header 'Content-Type: application/json' \
            --header 'X-XSRF-Header: PingFederate' \
            --data "@${BULK_CONFIG_DIR}/${BULK_CONFIG_FILE}" \
            --output "${_out}" \
            "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/cluster/replicate" \
            2>/dev/null
    )
    if test "${_importBulkConfig}" != "200" ; then
      jq -r . "${_out}"
      echo_red "Unable replicate config"
      exit 85
    fi
  fi
else 
  jq -r . "${_out}"
  echo_red "Unable to import bulk config"
  exit 85
fi