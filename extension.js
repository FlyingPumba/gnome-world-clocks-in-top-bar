import St from 'gi://St';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';


export default class WorldClockExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicators = new Map();
        this._timeoutId = null;
        this._settings = null;
    }

    enable() {
        this._settings = this.getSettings();
        
        // Add screen lock monitoring
        this._sessionModeChangedId = Main.sessionMode.connect('updated',
            () => this._onSessionModeChanged());
        
        // Only create clocks if screen is not locked
        if (!Main.sessionMode.isLocked) {
            this._createClocks();
        }
        
        // Start the timer
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._updateAllTimes();
            return GLib.SOURCE_CONTINUE;
        });
        
        // Connect to settings changes
        this._settingsChangedId = this._settings.connect('changed::timezones', 
            () => this._onTimezonesChanged());
    }

    disable() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
        
        // Destroy all indicators
        for (const indicator of this._indicators.values()) {
            indicator.destroy();
        }
        this._indicators.clear();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._sessionModeChangedId) {
            Main.sessionMode.disconnect(this._sessionModeChangedId);
            this._sessionModeChangedId = null;
        }
    }

    _createClocks() {
        const timezones = this._settings.get_strv('timezones');
        timezones.forEach((timezone) => {
            this._createClock(timezone);
        });
    }

    _createClock(timezone) {
        const indicator = new PanelMenu.Button(0.0, timezone);
        const label = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'system-status-label'
        });
        
        indicator.add_child(label);
        Main.panel._centerBox.insert_child_at_index(indicator.container, -1);
        
        this._indicators.set(timezone, {indicator, label});
        this._updateTime(timezone);
    }

    _updateAllTimes() {
        for (const timezone of this._indicators.keys()) {
            this._updateTime(timezone);
        }
        return GLib.SOURCE_CONTINUE;
    }

    _updateTime(timezone) {
        const {label} = this._indicators.get(timezone);
        const tzDateTime = GLib.DateTime.new_now(GLib.TimeZone.new(timezone));
        const timeString = tzDateTime.format('%H:%M');
        const timezone_name = timezone.split('/').pop().replace(/_/g, ' ');
        
        label.text = `${timezone_name}: ${timeString}`;
    }

    _onTimezonesChanged() {
        // Remove all existing clocks
        for (const indicator of this._indicators.values()) {
            indicator.destroy();
        }
        this._indicators.clear();

        // Create new clocks
        this._createClocks();
    }

    _onSessionModeChanged() {
        if (Main.sessionMode.isLocked) {
            // Remove all indicators when screen is locked
            for (const indicator of this._indicators.values()) {
                indicator.destroy();
            }
            this._indicators.clear();
        } else {
            // Recreate indicators when screen is unlocked
            this._createClocks();
        }
    }
} 