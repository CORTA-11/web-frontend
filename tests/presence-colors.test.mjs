import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "@playwright/test";

const css = readFileSync(new URL("../src/features/docs/editor.css", import.meta.url), "utf8");

test("participant caret and label colors match their presence indicators", async () => {
  const flatpakPath = "app/com.google.Chrome/current/active/files/extra/chrome";
  const executablePath = existsSync(chromium.executablePath()) ? undefined : [
    "/usr/bin/chromium",
    join("/var/lib/flatpak", flatpakPath),
    join(homedir(), ".local/share/flatpak", flatpakPath),
  ].find(existsSync);
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>
      :root { --cobalt: #0f6668; --ink: #0b0f14; --presence-1: #1637d6; --presence-2: #8c2946; }
      ${css}
    </style>`);
    // Inline participant colors are supplied by both renderCaret and PresenceList.
    const colors = await page.evaluate(() => {
      return ["var(--presence-1)", "var(--presence-2)"].map((color) => {
        const indicator = document.createElement("span");
        indicator.style.backgroundColor = color;
        const caret = document.createElement("span");
        caret.className = "collaboration-caret";
        caret.style.borderColor = color;
        const label = document.createElement("span");
        label.className = "collaboration-caret-label";
        label.style.backgroundColor = color;
        caret.append(label);
        document.body.append(indicator, caret);
        return {
          indicator: getComputedStyle(indicator).backgroundColor,
          caret: getComputedStyle(caret).borderLeftColor,
          label: getComputedStyle(label).backgroundColor,
        };
      });
    });
    for (const color of colors) {
      assert.equal(color.caret, color.indicator, "caret must match the presence indicator");
      assert.equal(color.label, color.indicator, "name label must match the presence indicator");
    }
    assert.notEqual(colors[0].caret, colors[1].caret, "different participant colors must remain distinct");
  } finally {
    await browser.close();
  }
});
