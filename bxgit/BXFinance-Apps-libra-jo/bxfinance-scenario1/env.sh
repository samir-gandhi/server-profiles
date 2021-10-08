#!/bin/bash

# Creates a JS file with a JSON object made up of
# 

# Recreate config file.
rm -rf ./env-config.js
touch ./env-config.js

# Start an object literal assigned to the global window object. 
echo "window._env_ = {" >> ./env-config.js

# Read each line in .env file
# Each line represents key=value pairs
while read -r line || test -n "${line}"
do
  #Only continue if the current line is not a comment "#".
  [[ ${line} =~ ^#.* ]] && continue
  # Split env variables by character `=`
  if printf '%s\n' "${line}" | grep -q -e '='
  then
    varname=$(printf '%s\n' "${line}" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "${line}" | sed -e 's/^[^=]*=//')
  fi

  # Read value of current environment variable if it exists.
  value=$(printf '%s\n' "${!varname}")
  # Otherwise use value from .env file
  test -z ${value} && value=${varvalue}
  
  # Append configuration property to object literal.
  echo "  ${varname}: \"$value\"," >> ./env-config.js
done < .env

# Close the object literal.
echo "}" >> ./env-config.js