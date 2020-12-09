#!/usr/bin/env sh
getSemanticImageVersion() {
  version=$(echo "${IMAGE_VERSION}" | grep -Eo "[0-9]+\.[0-9]+\.[0-9]")
  major=$(echo "${version}" | awk -F"." '{ print $1 }')
  minor=$(echo "${version}" | awk -F"." '{ print $2 }')
  patch=$(echo "${version}" | awk -F"." '{ print $3 }')
}

# send desired semantic version to be compared to image version.
#   example: IMAGE_VERSION=10.1.0
#   test $(isImageVersionGt 10.0.0) -eq 0 && echo "current image is greater"
isImageVersionGt() {
  getSemanticImageVersion
  aVersion=${1}
  aMajor=$(echo "${aVersion}" | awk -F"." '{ print $1 }')
  aMinor=$(echo "${aVersion}" | awk -F"." '{ print $2 }')
  aPatch=$(echo "${aVersion}" | awk -F"." '{ print $3 }')
  if test "${major}" -le "${aMajor}" && \
    test "${minor}" -le "${aMinor}" && \
    test "${patch}" -lt "${aPatch}" ; then
      echo 1
  else 
    echo 0
  fi
}
