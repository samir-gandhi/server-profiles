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

## attempt to accept license, works if new server, fails if admin exists. 
_acceptLicenseAgreement=$( 
  curl \
      --insecure \
      --silent \
      --request PUT \
      --write-out '%{http_code}' \
      --output /tmp/license.acceptance \
      --header "X-XSRF-Header: PingFederate" \
      --header 'Content-Type: application/json' \
      --data '{"accepted":true}' \
      "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/license/agreement" \
      2>/dev/null
)

case "${_acceptLicenseAgreement}" in
  200)
    # is new pf, create admin user. 
    echo "INFO: new server found, creating admin"
    if test "$(isImageVersionGt 10.1.0)" -eq 0 ; then
      adminRoles='["ADMINISTRATOR","USER_ADMINISTRATOR","CRYPTO_ADMINISTRATOR","EXPRESSION_ADMINISTRATOR"]'
    else
      adminRoles='["ADMINISTRATOR","USER_ADMINISTRATOR","CRYPTO_ADMINISTRATOR"]'
    fi
    _createAdminUser=$( 
    curl \
        --insecure \
        --silent \
        --write-out '%{http_code}' \
        --output /tmp/create.admin \
        --request POST \
        --user "${ROOT_USER}:${_initialPassword}" \
        --header "X-XSRF-Header: PingFederate" \
        --header 'Content-Type: application/json' \
        --data '{"username": "administrator", "password": "'"${_password}"'", "description": "Initial administrator user.", "auditor": false,"active": true, "roles": "'"${adminRoles}"'" }' \
        "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/administrativeAccounts" \
        2>/dev/null
    )
    if test "${_createAdminUser}" != "200" ; then
      jq -r . "/tmp/create.admin"
      echo_red "error attempting to create admin - check PING_IDENTITY_PASSWORD"
      exit 83
    fi
    ;;
  401)
    # not new pf, see if pw change is needed
    if test -n "${_initialPassword}"; then
      echo "INFO: attempting to change password"
      _changeAdminPassword=$( 
        curl \
            --insecure \
            --silent \
            --write-out '%{http_code}' \
            --output /dev/null \
            --request POST \
            --user "${ROOT_USER}:${_initialPassword}" \
            --header "X-XSRF-Header: PingFederate" \
            --header 'Content-Type: application/json' \
            --data '{"newPassword": "'"${_password}"'"}' \
            "https://localhost:${PF_ADMIN_PORT}/pf-admin-api/v1/administrativeAccounts/changePassword" \
            2>/dev/null
      )
      case "${_changeAdminPassword}" in
      422)
        # error code returned when trying to change pw on LDAP auth pf. 
        echo_red "pf.admin.api.authentication != NATIVE. Cannot change password via API."
        exit 83 ;;
      200)
        echo "INFO: Successfully changed admin password" ;;
      *)
        echo_red "Unable to change password - check PING_IDENTITY_PASSWORD or PING_IDENTITY_PASSWORD_INITIAL"
        exit 83 ;;
      esac
    fi
    ;;
  *)
    jq -r . "/tmp/license.acceptance"
    echo_red "License Agreement Failed"
    exit 83
    ;;
esac