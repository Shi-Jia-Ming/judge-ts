#!/bin/sh
nohup ./go-judge &
nohup node ./judge-ts/dist/index.js > output/output.log 2>&1