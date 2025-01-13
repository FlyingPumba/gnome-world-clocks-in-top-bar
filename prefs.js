import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class WorldClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        // Create search entry
        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: 'Search for a timezone...',
            margin_bottom: 10
        });

        // Create list box for selected timezones
        const listBox = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.NONE,
            css_classes: ['boxed-list']
        });

        // Get available timezones
        const timezonesFile = GLib.file_get_contents('/usr/share/zoneinfo/zone.tab');
        const availableTimezones = ['UTC'];
        if (timezonesFile[0]) {
            const content = new TextDecoder().decode(timezonesFile[1]);
            content.split('\n').forEach(line => {
                if (line && !line.startsWith('#')) {
                    const timezone = line.split('\t')[2];
                    if (timezone) {
                        availableTimezones.push(timezone);
                    }
                }
            });
        }
        availableTimezones.sort((a, b) => a.localeCompare(b));

        // Get current settings
        const settings = this.getSettings();
        const selectedTimezones = settings.get_strv('timezones');

        // Function to update the list of selected timezones
        const updateTimezonesList = () => {
            // Clear existing rows
            while (listBox.get_first_child()) {
                listBox.remove(listBox.get_first_child());
            }

            // Add new rows
            selectedTimezones.forEach((timezone, index) => {
                const row = new Gtk.ListBoxRow();
                const box = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 10,
                    margin_start: 10,
                    margin_end: 10,
                    margin_top: 5,
                    margin_bottom: 5
                });

                const label = new Gtk.Label({
                    label: timezone,
                    hexpand: true,
                    xalign: 0
                });

                const upButton = new Gtk.Button({
                    icon_name: 'go-up-symbolic',
                    sensitive: index > 0
                });

                const downButton = new Gtk.Button({
                    icon_name: 'go-down-symbolic',
                    sensitive: index < selectedTimezones.length - 1
                });

                const removeButton = new Gtk.Button({
                    icon_name: 'window-close-symbolic'
                });

                upButton.connect('clicked', () => {
                    if (index > 0) {
                        [selectedTimezones[index - 1], selectedTimezones[index]] = 
                        [selectedTimezones[index], selectedTimezones[index - 1]];
                        settings.set_strv('timezones', selectedTimezones);
                        updateTimezonesList();
                    }
                });

                downButton.connect('clicked', () => {
                    if (index < selectedTimezones.length - 1) {
                        [selectedTimezones[index], selectedTimezones[index + 1]] = 
                        [selectedTimezones[index + 1], selectedTimezones[index]];
                        settings.set_strv('timezones', selectedTimezones);
                        updateTimezonesList();
                    }
                });

                removeButton.connect('clicked', () => {
                    selectedTimezones.splice(index, 1);
                    settings.set_strv('timezones', selectedTimezones);
                    updateTimezonesList();
                });

                box.append(label);
                box.append(upButton);
                box.append(downButton);
                box.append(removeButton);
                row.set_child(box);
                listBox.append(row);
            });
        };

        // Search functionality
        let currentPopover = null;

        searchEntry.connect('search-changed', () => {
            const searchText = searchEntry.text.toLowerCase();
            
            // Dismiss existing popover if search is empty
            if (!searchText) {
                if (currentPopover) {
                    currentPopover.popdown();
                    currentPopover = null;
                }
                return;
            }

            const filteredTimezones = availableTimezones.filter(tz => 
                tz.toLowerCase().includes(searchText));

            if (filteredTimezones.length === 0) {
                if (currentPopover) {
                    currentPopover.popdown();
                    currentPopover = null;
                }
                return;
            }

            // Create popup menu with search results
            const popover = new Gtk.Popover({
                autohide: false,
                has_arrow: false
            });
            
            // Dismiss previous popover if it exists
            if (currentPopover) {
                currentPopover.popdown();
            }
            currentPopover = popover;
            
            const popoverBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 5
            });

            filteredTimezones.slice(0, 10).forEach(tz => {
                const button = new Gtk.Button({
                    label: tz,
                    hexpand: true
                });
                button.connect('clicked', () => {
                    if (!selectedTimezones.includes(tz)) {
                        selectedTimezones.push(tz);
                        settings.set_strv('timezones', selectedTimezones);
                        updateTimezonesList();
                    }
                    popover.popdown();
                    searchEntry.text = '';  // Clear the search entry
                });
                popoverBox.append(button);
            });

            popover.set_child(popoverBox);
            popover.set_parent(searchEntry);
            popover.popup();
            searchEntry.grab_focus();  // Keep focus on the search entry
        });

        group.add(searchEntry);
        group.add(listBox);
        window.add(page);

        // Initial population of the list
        updateTimezonesList();
    }
}