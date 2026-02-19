/**
 * PDF text extraction using pdf-parse.
 */

import { readFileSync } from "fs";

/**
 * Extract all text content from a PDF file.
 * Returns the raw text as a single string.
 */
export async function extractPdfText(filePath: string): Promise<string> {
  // pdf-parse v2 uses named exports
  const { default: pdfParse } = await (import("pdf-parse") as any);
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
