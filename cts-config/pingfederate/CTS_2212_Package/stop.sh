#!/bin/bash
# Grabs and kill a process from the pidlist that has the word myapp

pid=`ps -ef | grep cts_2_0/config/jetty.xml | awk '{print $2}'`
printf "%s\n" "....Stopping CTS"
echo $pid
kill -9 $pid
