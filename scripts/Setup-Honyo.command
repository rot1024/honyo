#!/bin/bash
APP_PATH="/Applications/Honyo.app"

if [ ! -d "$APP_PATH" ]; then
  osascript -e 'display dialog "Please copy Honyo.app to Applications folder first." buttons {"OK"} default button 1'
  exit 1
fi

xattr -cr "$APP_PATH"

osascript -e 'display dialog "Honyo is ready to launch! Please start it from Launchpad." buttons {"OK"} default button 1'
