/**
 * Utility functions for constructing and parsing shareable detail view URLs.
 *
 * URL format: /{module}?view={id}
 * With tab:   /{module}?view={id}&tab={tabName}
 */

/**
 * Validates that the value is a positive integer string.
 * Returns the parsed number or null if invalid.
 */
export function parseViewId(value: string | undefined | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = parseInt(trimmed, 10);
  if (num <= 0 || !Number.isFinite(num)) return null;
  return num;
}

/**
 * Constructs the full shareable URL in format: origin + "/" + module + "?view=" + id
 */
export function buildShareableUrl(
  origin: string,
  module: string,
  id: string | number,
): string {
  return `${origin}/${module}?view=${id}`;
}

/**
 * Constructs a shareable URL with an optional tab parameter.
 * Format: origin + "/" + module + "?view=" + id + "&tab=" + tabName (when tab is provided and non-empty)
 * Falls back to the same output as buildShareableUrl when tab is not provided.
 */
export function buildShareableUrlWithTab(
  origin: string,
  module: string,
  id: string | number,
  tab?: string,
): string {
  const base = `${origin}/${module}?view=${id}`;
  if (tab && tab.trim()) {
    return `${base}&tab=${tab.trim()}`;
  }
  return base;
}

/**
 * Validates a tab name parameter.
 * Valid tab names contain only lowercase letters, numbers, and hyphens.
 * Returns the validated tab name or null if invalid.
 */
export function parseTabParam(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-z0-9-]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Adds or removes the `view` and `tab` params while preserving all other params (page, q, filters).
 * Returns a new URLSearchParams instance - does not mutate the input.
 */
export function preserveQueryParams(
  currentParams: URLSearchParams,
  addView?: string | number,
  removeView?: boolean,
  options?: { addTab?: string; removeTab?: boolean },
): URLSearchParams {
  const result = new URLSearchParams(currentParams.toString());

  if (removeView) {
    result.delete("view");
  }

  if (addView !== undefined) {
    result.set("view", String(addView));
  }

  if (options?.removeTab) {
    result.delete("tab");
  }

  if (options?.addTab !== undefined) {
    result.set("tab", options.addTab);
  }

  return result;
}
