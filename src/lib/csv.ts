function safeSpreadsheetText(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // CSVs are commonly opened in spreadsheet apps. Treat formula-looking source data as text.
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function toCsv(rows: unknown[][]): string {
  return rows
    .map((row) => row.map((value) => `"${safeSpreadsheetText(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}
