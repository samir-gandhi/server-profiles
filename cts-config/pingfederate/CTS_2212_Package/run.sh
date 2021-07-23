#!/bin/bash
# If you are going to use this start script, please do the following:
# 1. Update the jetty.xml file and set the FULL path to the cts_server.keystore
#    e.g.: 
#        <Set name="keyStorePath">config/cts_server.keystore</Set>
#
# 2. Update the cts.properties file so that agentSmHostConfigFile and authenticatedUserSerialNumberPath is set to the FULL path to the file
#    e.g.:
#      agentSmHostConfigFile=/apps/CA/coreblox-tokenservice-1.0/cts/config/cbSmHost.conf
#      agentConfigObject=coreblox_tokenservices_aco
#      authenticatedUserSerialNumberPath=/apps/CA/coreblox-tokenservice-1.0/cts/config/authenticatedUsers.txt
#      authRequestURI=/coreblox-tokenservice/1/token/
#      forceCertValidation=no
#      useSharedSecret=no
#
# 3. Update JAVA_HOME and CTS_HOME to the locations of your jdk and CTS deployments.  
#    The current values are provided as examples and must be modified to fit your specific installation.
# 

JAVA_HOME=/apps/Java/jdk
CTS_HOME=/apps/CA/coreblox-tokenservice-1.0/cts_2_0
LOG_FILE=$CTS_HOME/logs/cts_start.log
nohup $JAVA_HOME/bin/java -DINFO -cp $CTS_HOME/config:$CTS_HOME/lib/smagentapi.jar:$CTS_HOME/lib/cryptoj.jar:$CTS_HOME/coreblox-tokenservice-combined-2.0.war:. Launch $CTS_HOME/config/jetty.xml >$CTS_HOME/cts_start.log 2>&1 & 
