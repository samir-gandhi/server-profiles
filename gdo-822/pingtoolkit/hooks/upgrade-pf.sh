#!/usr/bin/env sh

env

## ENV VARS: 
# PING_IDENTITY_DEVOPS_USER
# PING_IDENTITY_DEVOPS_KEY
NEW_PF_VERSION="${NEW_PF_VERSION:-10.3.1}"
RELEASE=${RELEASE:=sg-822}

## GET new product bits and license
    ## download product to /tmp/pingfederate-<version>.zip
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -c
unzip -d /opt/new "/tmp/pingfederate-${NEW_PF_VERSION}.zip"
  ## download license to /tmp/pingfederate.lic
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -l -c

## cp out-dir from admin
pfPodName=$(kubectl get pod --selector=app.kubernetes.io/instance=${RELEASE} --selector=app.kubernetes.io/name=pingfederate-admin -o=jsonpath='{.items[*].metadata.name}')

## patch pf-admin sts to turn off admin.  
##TODO: cleaner resource name, should be var. 
kubectl set env sts/sg-822-pingfederate-admin STARTUP_COMMAND="tail" STARTUP_FOREGROUND_OPTS="-f /dev/null"
_timeoutElapsed=1
_timeout=1000
## wait for health
  while test $_timeoutElapsed -lt $_timeout ; do
    sleep 6
    if test $(kubectl get pods -l app.kubernetes.io/instance="${RELEASE}" -o go-template='{{range $index, $element := .items}}{{range .status.containerStatuses}}{{if not .ready}}{{$element.metadata.name}}{{"\n"}}{{end}}{{end}}{{end}}' | wc -l ) = 0 ; then
      readyCount=$(( readyCount+1 ))
      sleep 4
    else 
      crashingPods=$(kubectl get pods -l app.kubernetes.io/instance="${RELEASE}" -n "${K8S_NAMESPACE}" -o go-template='{{range $index, $element := .items}}{{range .status.containerStatuses}}{{if gt .restartCount 2 }}{{$element.metadata.name}}{{"\n"}}{{end}}{{end}}{{end}}')
      numCrashing=$(echo "${crashingPods}" |wc -c)
      if test $numCrashing -gt 5 ; then
        echo "ERROR: Found pods crashing $crashingPods"
        _timeoutElapsed=$(( _timeout+1 ))
      fi
    fi
    if test ${readyCount} -ge 3 ; then
      echo "INFO: Successfully Deployed."
      break
    fi
    _timeoutElapsed=$((_timeoutElapsed+6))
  done


mkdir -p /opt/current /opt/current_bak
kubectl cp ${pfPodName}:/opt/out /opt/current_bak
cp -r /opt/current_bak/instance /opt/current/pingfederate

cd /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/upgrade/bin
sh upgrade.sh /opt/current -l /tmp/pingfederate.lic --release-notes-reviewed

diff -r /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/server/default/data /opt/current/pingfederate/server/default/data

# echo_red "REALLY BAD SECURITY PRACTICE, WHY ARE YOU DOING THIS!?"



# kubectl exec -it ${pfPodName} -- rm -rf /opt/out/instance/server/default/default/data/*
# kubectl cp "/opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/server/default/data" ${pfPodName}:/opt/out/instance/server/default/data