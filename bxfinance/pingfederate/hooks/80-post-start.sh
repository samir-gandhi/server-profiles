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
    echo "INFO: bringing down eth0 and waiting for PingFederate to start.."
    ip link set eth0 down

    wait-for "localhost:${PF_ADMIN_PORT}" -t 200
    test ${?} -ne 0 && kill 1
    "${HOOKS_DIR}/81-after-start-process.sh"
    test ${?} -ne 0 && kill 1

    echo "Bringing eth0 back up"
    ip link set eth0 up
else 
  exit 0
fi