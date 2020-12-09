#!/usr/bin/env sh
#
# Ping Identity DevOps - Docker Build Hooks
#
#- This script is started in the background immediately before 
#- the server within the container is started
#-
#- This is useful to implement any logic that needs to occur after the
#- server is up and running
#-
#- For example, enabling replication in PingDirectory, initializing Sync 
#- Pipes in PingDataSync or issuing admin API calls to PingFederate or PingAccess

# shellcheck source=../../../../pingcommon/opt/staging/hooks/pingcommon.lib.sh
. "${HOOKS_DIR}/pingcommon.lib.sh"

engineList=$(
  curl \
  --insecure \
  --silent \
  --request GET \
  --user "administrator:2FederateM0re" \
  --header "X-Xsrf-Header: PingAccess" \
  https://localhost:9000/pa-admin-api/v3/engines/status | jq -r '.'
)

currentServerTime=$(echo "${engineList}" | jq -r '.currentServerTime')
engineIds=$(echo $engineList | jq -r '.enginesStatus | keys | .[]')

for engineId in $engineIds; do 
  # echo $engine
  lastUpdated=$(echo "${engineList}" | jq '.enginesStatus."'"$engineId"'".lastUpdated')
  lastUpdatedDiff=$(( currentServerTime - lastUpdated ))
  pollingDelay=$(echo "${engineList}" | jq '.enginesStatus."'"$engineId"'".pollingDelay')
  if test "$lastUpdatedDiff" -gt "$pollingDelay" ; then
    
    echo "found old engine with ID: $engineId"
    echo_yellow "deleting engine with ID: $engineId"
      curl \
        --insecure \
        --silent \
        --write-out '%{http_code}' \
        --request DELETE \
        --user "administrator:2FederateM0re" \
        --header "X-Xsrf-Header: PingAccess" \
        "https://localhost:9000/pa-admin-api/v3/engines/$engineId" | jq -r '.'
  fi
done