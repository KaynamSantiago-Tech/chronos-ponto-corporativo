import * as XLSX from "xlsx";

export interface XlsxColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export function baixarXlsx<T>(
  nomeArquivo: string,
  linhas: T[],
  colunas: XlsxColumn<T>[],
  sheetName = "Dados",
): void {
  const data = [
    colunas.map((c) => c.header),
    ...linhas.map((row) =>
      colunas.map((c) => {
        const v = c.value(row);
        return v === null || v === undefined ? "" : v;
      }),
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const nome = nomeArquivo.endsWith(".xlsx") ? nomeArquivo : `${nomeArquivo}.xlsx`;
  XLSX.writeFile(wb, nome);
}
