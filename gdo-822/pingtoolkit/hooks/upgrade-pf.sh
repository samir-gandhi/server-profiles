#!/usr/bin/env sh

env

## ENV VARS: 
PING_IDENTITY_DEVOPS_USER
PING_IDENTITY_DEVOPS_KEY
NEW_PF_VERSION="${NEW_PF_VERSION:-10.3.1}"
RELEASE_NAME=${RELEASE_NAME:=sg-822}

## GET new product bits and license
    ## download product to /tmp/pingfederate-<version>.zip
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -c
unzip -d /opt/new "/tmp/pingfederate-${NEW_PF_VERSION}.zip"
  ## download license to /tmp/pingfederate.lic
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -l -c

## cp out-dir from admin
pfPodName=$(kubectl get pod --selector=app.kubernetes.io/instance=${RELEASE_NAME} --selector=app.kubernetes.io/name=pingfederate-admin -o=jsonpath='{.items[*].metadata.name}')

mkdir -p /opt/current /opt/current_bak
kubectl cp ${pfPodName}:/opt/out /opt/current_bak
cp -r /opt/current_bak/instance /opt/current/pingfederate

cd /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/upgrade/bin
sh upgrade.sh /opt/current -l /tmp/pingfederate.lic --release-notes-reviewed

diff -r /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/server/default/data /opt/current/pingfederate/server/default/data