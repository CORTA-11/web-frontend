import type { EditorPresence } from "@/features/docs/presence";

type Props = { editors: EditorPresence[] };

export function PresenceList({ editors }: Props) {
  return (
    <div className="flex min-h-7 items-center gap-2" aria-label="Document presence">
      <span className="label-eyebrow">Present</span>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Editors present">
        {editors.map((editor) => (
          <li
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            data-session-id={editor.sessionId}
            key={`${editor.clientId}:${editor.sessionId}`}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: editor.color }}
            />
            <span>{editor.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
