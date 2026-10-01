"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/features/guided-tour/steps";

export function GuidedTour({ steps, disabled = false }: { steps: TourStep[]; disabled?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const complete = index === steps.length;
  const step = steps[index];
  const selectStep = (next: number) => {
    const target = steps[next]?.target;
    setAnchor(target
      ? trigger.current?.closest("nav")?.querySelector<HTMLElement>(`[data-tour="${target}"]`) ?? trigger.current
      : trigger.current);
    setIndex(next);
  };

  useEffect(() => {
    if (!open || !anchor || complete) return;
    anchor.scrollIntoView({ block: "nearest", behavior: "instant" });
    anchor.setAttribute("data-tour-active", "true");
    return () => anchor.removeAttribute("data-tour-active");
  }, [open, anchor, complete]);

  return (
    <Popover.Root open={open} onOpenChange={(value) => { setOpen(value); if (value) selectStep(0); }}>
      <Popover.Trigger
        ref={trigger}
        disabled={disabled}
        className="flex min-h-9 w-full items-center gap-2 px-5 text-sm font-bold text-sidebar-foreground hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-sidebar-ring"
      >
        <CompassIcon className="size-4 shrink-0" /> Guided tour
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner anchor={anchor} side="right" align="start" sideOffset={12} collisionPadding={12} className="z-50">
          <Popover.Popup data-testid="guided-tour" className="flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-4 border-2 border-border bg-popover p-5 text-popover-foreground shadow-md outline-none">
            <p className="label-eyebrow tabular-nums" aria-live="polite">
              {complete ? "Tour complete" : `Step ${index + 1} of ${steps.length}`}
            </p>
            <Popover.Title className="text-lg font-extrabold">{complete ? "You're ready" : step.title}</Popover.Title>
            <Popover.Description className="text-sm leading-relaxed">
              {complete ? "Explore at your own pace. Replay this tour anytime from Guided tour at the bottom of the sidebar." : step.description}
            </Popover.Description>
            <div className="flex flex-wrap items-center gap-2">
              <Popover.Close render={<Button variant="ghost" size="sm" />}>
                {complete ? "Done" : "Skip"}
              </Popover.Close>
              <Button variant="outline" size="sm" disabled={index === 0} onClick={() => selectStep(index - 1)}>Back</Button>
              {!complete && <Button size="sm" onClick={() => selectStep(index + 1)}>{index === steps.length - 1 ? "Finish" : "Next"}</Button>}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
