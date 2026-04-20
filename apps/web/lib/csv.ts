/**
 * Gera CSV (UTF-8 com BOM para Excel) a partir de colunas e linhas.
 * Escape segue RFC 4180: valores com `,`, `"`, `\r` ou `\n` são envolvidos
 * em aspas duplas; aspas internas são duplicadas.
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export function gerarCsv<T>(linhas: T[], colunas: CsvColumn<T>[]): string {
  const escape = (raw: string | number | null | undefined): string => {
    if (raw === null || raw === undefined) return "";
    const s = String(raw);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = colunas.map((c) => escape(c.header)).join(",");
  const body = linhas
    .map((row) => colunas.map((c) => escape(c.value(row))).join(","))
    .join("\r\n");

  return `\uFEFF${header}\r\n${body}`;
}

/**
 * Faz download do conteúdo como arquivo CSV no browser.
 */
export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
