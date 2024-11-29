#!/bin/sh
nohup ./go-judge -silent &
nohup node ./judge-ts/dist/index.js > output/output.log 2>&1
