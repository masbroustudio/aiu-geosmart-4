import Papa from "papaparse";
import * as fs from "fs";
import * as path from "path";

export function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data as T[];
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[,%]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

export function resolveDataPath(relativePath: string): string {
  // From compiled dist/ directory, we need to go up to api/, then to ml/data/
  return path.resolve(__dirname, "../../..", "ml/data", relativePath);
}

export function filterByField<T>(data: T[], field: keyof T, value: string | undefined): T[] {
  if (!value) return data;
  return data.filter(
    (item) =>
      String(item[field]).toLowerCase() === value.toLowerCase()
  );
}

export function paginateData<T>(data: T[], limit: number): T[] {
  return data.slice(0, limit);
}
