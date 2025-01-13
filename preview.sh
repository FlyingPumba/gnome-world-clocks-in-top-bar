#!/bin/bash -e

# Basically following the instructions from https://gjs.guide/extensions/development/debugging.html#running-a-nested-gnome-shell

# export G_MESSAGES_DEBUG=all
export MUTTER_DEBUG_DUMMY_MODE_SPECS=1366x768
export SHELL_DEBUG=all

# Install extension
./install.sh

# Run gnome-shell in a nested session
dbus-run-session -- gnome-shell --nested --wayland
