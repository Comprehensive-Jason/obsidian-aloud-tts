// The CSS Custom Highlight API isn't in this TypeScript version's DOM types, so
// this wraps the two parts used here.

interface HighlightRegistry {
  set(name: string, highlight: unknown): unknown;
  delete(name: string): boolean;
}

type HighlightConstructor = new (...ranges: Range[]) => unknown;

function registry(): HighlightRegistry | null {
  const css = globalThis.CSS as unknown as
    | { highlights?: HighlightRegistry }
    | undefined;
  return css?.highlights ?? null;
}

/** Whether the browser can paint highlights over arbitrary text ranges */
export function highlightsSupported(): boolean {
  return (
    registry() !== null &&
    typeof (globalThis as { Highlight?: unknown }).Highlight === "function"
  );
}

/** Paints `range` under `name`, replacing whatever that name painted before */
export function setHighlight(name: string, range: Range): void {
  const Highlight = (globalThis as { Highlight?: HighlightConstructor })
    .Highlight!;
  registry()?.set(name, new Highlight(range));
}

export function deleteHighlight(name: string): void {
  registry()?.delete(name);
}
