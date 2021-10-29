#!/usr/bin/env sh

set -e

env

## ENV VARS: 
# PING_IDENTITY_DEVOPS_USER
# PING_IDENTITY_DEVOPS_KEY
NEW_PF_VERSION="${NEW_PF_VERSION:-10.3.2}"
RELEASE=${RELEASE:-sg-822}
PF_ADMIN_PRIVATE_HOSTNAME=${PF_ADMIN_PRIVATE_HOSTNAME:-sg-822-pingfederate-admin}
PF_ADMIN_PRIVATE_PORT_HTTPS=${PF_ADMIN_PRIVATE_PORT_HTTPS:-9999}

## GET new product bits and license
    ## download product to /tmp/pingfederate-<version>.zip
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -c
unzip -d /opt/new "/tmp/pingfederate-${NEW_PF_VERSION}.zip"
  ## download license to /tmp/pingfederate.lic
sh /opt/staging/hooks/get-bits.sh -p pingfederate -v "${NEW_PF_VERSION}" -u "${PING_IDENTITY_DEVOPS_USER}" -k "${PING_IDENTITY_DEVOPS_KEY}" -l -c

## get admin pod name
pfPodName=$(kubectl get pod --selector=app.kubernetes.io/instance=${RELEASE} --selector=app.kubernetes.io/name=pingfederate-admin -o=jsonpath='{.items[*].metadata.name}')

## patch pf-admin sts to start admin in background mode
kubectl patch sts sg-822-pingfederate-admin --patch "$( cat /opt/staging/hooks/pf-patch.yaml )"

echo "waiting for running pod"

## TODO: make this more efficient
sleep 45 #sleep isn't good enough for pods that take forever to come up. 
pfPodIp=$(kubectl get pod "${pfPodName}" -o=wide | grep "${pfPodName}" | awk '{print $6}')
until test $(curl -ksS https://${pfPodIp}:${PF_ADMIN_PRIVATE_PORT_HTTPS}/pingfederate/app --write-out '%{http_code}' --output /dev/null) -eq 200 ; do
  sleep 2
done

## Kill the PF process
kubectl exec ${pfPodName} -- pkill /opt/java/bin/java
## let pf shutdown
sleep 15

mkdir -p /opt/current /opt/current_bak
kubectl cp ${pfPodName}:/opt/out /opt/current_bak
kubectl cp ${pfPodName}:/opt/staging /opt/staging_bak
cp -r /opt/current_bak/instance /opt/current/pingfederate

cd /opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/upgrade/bin
sh upgrade.sh /opt/current -l /tmp/pingfederate.lic --release-notes-reviewed

diff -r /opt/current/pingfederate/server/default/data /opt/current_bak/instance/server/default/data

## Profile Diff:
set -x
stgFiles=$(find /opt/staging_bak/instance/ -type f)
for f in $stgFiles ; do 
  echo "$f" |  cut -d"/" -f5- >> /tmp/stagingFileList
done
while read -r line; do 
  diff "/opt/staging_bak/instance/${line}" "/opt/current/instance/${line}"
done < /tmp/stagingFileList


# echo_red "REALLY BAD SECURITY PRACTICE, WHY ARE YOU DOING THIS!?"



# kubectl exec ${pfPodName} -- sh -c 'rm -rf /opt/out/instance/server/default/data/*'
# kubectl cp "/opt/new/pingfederate-${NEW_PF_VERSION}/pingfederate/server/default/data" ${pfPodName}:/opt/out/instance/server/default/data/.

## Ready for helm upgrade 10.3.2 now
##TODO: cleaner resource name, should be var. 
# kubectl set env sts/sg-822-pingfederate-admin STARTUP_COMMAND- STARTUP_FOREGROUND_OPTS-
# kubectl delete pod ${pfPodName}