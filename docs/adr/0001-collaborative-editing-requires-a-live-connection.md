---
status: superseded by ADR-0002
---

# Collaborative editing requires a live connection

Editors may change a Document only while its Document Room is connected and synchronized, and the UI says "Saved" only after the core API acknowledges a database revision and Yjs state vector containing the Editor's changes. After a connection or persistence failure, the editor becomes read-only and keeps a visible warning that recent changes were not saved. Editing resumes only when the Editor explicitly chooses "Reload saved version," which rebuilds the local Yjs Document from the durable checkpoint and discards unacknowledged changes. If collaboration is unavailable when opening a Document, the last materialized projection remains readable but not editable.
