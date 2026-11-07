/** `{token}` interpolation for client islands that receive their copy as props (no i18n table in the bundle). */
export const interpolate = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
