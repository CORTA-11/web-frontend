---
status: accepted
---

# Use standard Yjs reconnect for the first release

The first collaborative-editor release uses the provider's standard reconnect-and-merge behavior rather than discarding local updates or rebuilding the Yjs Document after a connection failure. The UI reports `Connecting`, `Synced`, or `Offline—changes will sync when reconnected`; it does not claim that each keystroke is durably saved. Custom durable acknowledgements, forced read-only recovery, and manual reload flows are deferred in favor of a working conflict-free editor.
