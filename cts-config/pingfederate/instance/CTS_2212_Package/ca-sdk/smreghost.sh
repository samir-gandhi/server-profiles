#!/bin/ksh

#########################################################################################
## Copyright (c) 2006 CA.  All rights reserved.                                        ##
## This software may not be duplicated, disclosed or reproduced in whole or            ##
## in part for any purpose except as authorized by the applicable license agreement,   ##
## without the express written authorization of CA. All authorized reproductions       ##
## must be marked with this language.                                                  ##
##                                                                                     ##
## TO THE EXTENT PERMITTED BY APPLICABLE LAW, CA PROVIDES THIS                         ##
## SOFTWARE "AS IS" WITHOUT WARRANTY OF ANY KIND, INCLUDING                            ##
## WITHOUT LIMITATION, ANY IMPLIED WARRANTIES OF MERCHANTABILITY,                      ##
## FITNESS FOR A PARTICULAR PURPOSE OR NONINFRINGEMENT.  IN NO EVENT                   ##
## WILL CA BE LIABLE TO THE END USER OR ANY THIRD PARTY FOR ANY LOSS                   ##
## OR DAMAGE, DIRECT OR INDIRECT, FROM THE USE OF THIS MATERIAL,                       ##
## INCLUDING WITHOUT LIMITATION, LOST PROFITS, BUSINESS                                ##
## INTERRUPTION, GOODWILL, OR LOST DATA, EVEN IF CA IS EXPRESSLY                       ##
## ADVISED OF SUCH LOSS OR DAMAGE.                                                     ##
#########################################################################################

export JAVA_HOME=/opt/java
export SM_SMREGHOST_CLASSPATH=/opt/out/instance/CTS_2212_Package/ca-sdk/java64
/smagentapi.jar: /opt/out/instance/CTS_2212_Package/ca-sdk/java64 /cryptoj.jar
export PATH=$JAVA_HOME/bin:$PATH

java -classpath "$SM_SMREGHOST_CLASSPATH" com.ca.siteminder.sdk.agentapi.SmRegHost "$@"
# The caller needs the exit status from SmRegHost