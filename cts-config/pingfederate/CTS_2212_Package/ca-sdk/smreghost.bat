@echo off

REM #########################################################################################
REM ## Copyright (c) 2006 CA.  All rights reserved.                                        ##
REM ## This software may not be duplicated, disclosed or reproduced in whole or            ##
REM ## in part for any purpose except as authorized by the applicable license agreement,   ##
REM ## without the express written authorization of CA. All authorized reproductions       ##
REM ## must be marked with this language.                                                  ##
REM ##                                                                                     ##
REM ## TO THE EXTENT PERMITTED BY APPLICABLE LAW, CA PROVIDES THIS                         ##
REM ## SOFTWARE �AS IS� WITHOUT WARRANTY OF ANY KIND, INCLUDING                            ##
REM ## WITHOUT LIMITATION, ANY IMPLIED WARRANTIES OF MERCHANTABILITY,                      ##
REM ## FITNESS FOR A PARTICULAR PURPOSE OR NONINFRINGEMENT.  IN NO EVENT                   ##
REM ## WILL CA BE LIABLE TO THE END USER OR ANY THIRD PARTY FOR ANY LOSS                   ##
REM ## OR DAMAGE, DIRECT OR INDIRECT, FROM THE USE OF THIS MATERIAL,                       ##
REM ## INCLUDING WITHOUT LIMITATION, LOST PROFITS, BUSINESS                                ##
REM ## INTERRUPTION, GOODWILL, OR LOST DATA, EVEN IF CA IS EXPRESSLY                       ##
REM ## ADVISED OF SUCH LOSS OR DAMAGE.                                                     ##
REM #########################################################################################

setlocal
set JAVA_HOME=
set SM_SMREGHOST_CLASSPATH=C:\CA\sdk\java\smagentapi.jar;C:\CA\sdk\java\cryptoj.jar

set PATH=%JAVA_HOME%\bin;%PATH%

java -classpath "%SM_SMREGHOST_CLASSPATH%" com.ca.siteminder.sdk.agentapi.SmRegHost %*
endlocal
