export function safeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Text beginning with a spreadsheet instruction is escaped, including after
  // whitespace. Legitimate numeric values remain numeric when passed as numbers.
  if (typeof value !== "number" && /^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

