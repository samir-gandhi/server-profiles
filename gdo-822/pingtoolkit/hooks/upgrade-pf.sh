#!/usr/bin/env sh

## ENV VARS: 
PING_IDENTITY_DEVOPS_USER
PING_IDENTITY_DEVOPS_KEY
NEW_PF_VERSION="${NEW_PF_VERSION:-10.3.}"

## GET new product bits and license
    ## download product to /tmp/pingfederate-<version>.zip
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -c
unzip -d unzip -d /opt/new "/tmp/pingfederate-${NEW_PF_VERSION}.zip"
  ## download license to /tmp/pingfederate.lic
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -l -c

## cp out-dir from admin
pfPodName=$(kubectl get pod --selector=app.kubernetes.io/instance=gdo-822 --selector=app.kubernetes.io/name=pingfederate-admin -o=jsonpath='{.items[*].metadata.name}')

mkdir -p /opt/current
kubectl cp ${pfPodName}:/opt/out /opt/current

cd /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/upgrade/bin
./upgrade.sh /opt/current/instance -l /tmp/pingfederate.lic --release-notes-reviewed