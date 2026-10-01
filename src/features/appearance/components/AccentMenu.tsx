"use client";

import {
  DropdownMenuGroup, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAccent } from "@/features/appearance/useAccent";
import { accents } from "@/features/appearance/accents";

export function AccentMenu() {
  const { accent, setAccent } = useAccent();
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="label-eyebrow">Accent</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={accent}
        onValueChange={(value) => {
          const option = accents.find((option) => option.value === value);
          if (option) setAccent(option.value);
        }}
      >
        {accents.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}
