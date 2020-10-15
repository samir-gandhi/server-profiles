#!/usr/bin/env sh
#
# Ping Identity DevOps - Docker Build Hooks
#
#- This script is used to import any configurations that are
#- needed after PingFederate starts

# shellcheck source=../../../../pingcommon/opt/staging/hooks/pingcommon.lib.sh
. "${HOOKS_DIR}/pingcommon.lib.sh"

if test "${OPERATIONAL_MODE}" = "CLUSTERED_CONSOLE" -o "${OPERATIONAL_MODE}" = "STANDALONE" 
then
    echo "INFO: waiting for healthy admin before post-start.."
    _adminReady=false
    until "${_adminReady}" ; do
      _success=$(
        curl -k \
          --write-out '%{http_code}' \
          https://localhost:${PF_ADMIN_PORT}/pingfederate/app
        )
      if test "${_success}" = "200" ; then
        _adminReady=true
      else
        sleep 1
      fi
    done
    # wait-for "localhost:${PF_ADMIN_PORT}" -t 200
    # test ${?} -ne 0 && kill 1
    "${HOOKS_DIR}/81-after-start-process.sh"
    test ${?} -ne 0 && kill 1

    # everything was successful, pf is ready. 
    touch /tmp/ready
else 
  exit 0
fi