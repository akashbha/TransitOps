/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts an array of objects into a CSV string and initiates a browser download.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[],
) {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  const csvHeaders = headers ? headers.join(",") : keys.join(",");

  const csvRows = data.map((row) => {
    return keys
      .map((key) => {
        let val = row[key];
        if (val === undefined || val === null) {
          val = "";
        } else if (typeof val === "string") {
          // Escape quotes
          val = `"${val.replace(/"/g, '""')}"`;
        } else if (typeof val === "object") {
          val = `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",");
  });

  const csvContent = [csvHeaders, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
