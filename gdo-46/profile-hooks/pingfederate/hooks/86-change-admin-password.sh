#!/usr/bin/env sh
# shellcheck source=../../../../pingcommon/opt/staging/hooks/pingcommon.lib.sh
. "${HOOKS_DIR}/pingcommon.lib.sh"


## set script vars
_initialPassword=$(get_value PING_IDENTITY_PASSWORD_INITIAL true)

_password=$(get_value PING_IDENTITY_PASSWORD true)
if test -n "${_initialPassword}" -a -z "${_password}"; then
  echo_red "found initial password, but no new password"
  exit 83
fi

echo "INFO: attempting to change password"
_changeAdminPassword=$( 
  curl \
      --insecure \
      --silent \
      --write-out '%{http_code}' \
      --output /tmp/change.password \
      --request POST \
      --user "${ROOT_USER}:${_initialPassword}" \
      --header "X-XSRF-Header: PingFederate" \
      --header 'Content-Type: application/json' \
      --data '{"currentPassword": "'"${_initialPassword}"'","newPassword": "'"${_password}"'"}' \
      "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/administrativeAccounts/changePassword" \
      2>/dev/null
)

case "${_changeAdminPassword}" in
  422)
    # error code returned when trying to change pw on LDAP auth pf. 
    jq -r . "/tmp/change.password"
    echo_red "Unable to change password via API"
    exit 83 ;;
  200)
    echo "INFO: Successfully changed admin password" ;;
  *)
    jq -r . "/tmp/change.password"
    echo_red "Unable to change password - check PING_IDENTITY_PASSWORD or PING_IDENTITY_PASSWORD_INITIAL"
    exit 83 ;;
esac