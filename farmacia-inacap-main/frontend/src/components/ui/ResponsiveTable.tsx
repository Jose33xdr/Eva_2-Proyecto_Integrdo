import type { ReactNode } from "react";
import "./ui.module.css";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export const ResponsiveTable = <T,>({
  columns,
  rows,
  getKey,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  getKey: (row: T) => string;
}) => (
  <div className="table-shell">
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={column.className}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getKey(row)}>
            {columns.map((column) => (
              <td key={column.key} className={column.className}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
