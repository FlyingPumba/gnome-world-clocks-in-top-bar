#!/bin/bash

EXTENSION_NAME="worldclocksintopbar@iarcuschin.com"
EXTENSION_PATH="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_NAME"

# Create extension directory
mkdir -p "$EXTENSION_PATH"
mkdir -p "$EXTENSION_PATH/schemas"

# Compile schema
glib-compile-schemas schemas/

# Copy files
cp *.json "$EXTENSION_PATH/"
cp *.js "$EXTENSION_PATH/"
cp *.css "$EXTENSION_PATH/"
cp schemas/* "$EXTENSION_PATH/schemas/"

# Restart GNOME Shell (only on X11)
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo "Please press Alt+F2, type 'r' and press Enter to restart GNOME Shell"
else
    echo "Please log out and log back in to activate the extension"
fi 