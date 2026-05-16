import Papa from "papaparse";

export function parseCSV(content: string): {
  headers: string[];
  rows: string[][];
} {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  if (result.data.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = result.data[0];
  const rows = result.data.slice(1);

  return { headers, rows };
}
