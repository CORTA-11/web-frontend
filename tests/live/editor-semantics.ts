import type { Locator } from "@playwright/test";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

async function read(locator: Locator) {
  const content = await locator.evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".collaboration-caret").forEach((caret) => caret.remove());
    clone.querySelectorAll(".collaboration-selection").forEach((selection) => {
      selection.replaceWith(...selection.childNodes);
    });
    return { html: clone.innerHTML, text: clone.innerText };
  });
  return { html: normalize(content.html), text: normalize(content.text) };
}

export const editorSemantics = { normalize, read };
