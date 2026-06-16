declare module "xlsx" {
  export type WorkBook = unknown;
  export type WorkSheet = { [key: string]: unknown };
  export const utils: {
    book_new(): WorkBook;
    aoa_to_sheet(data: unknown[][]): WorkSheet;
    book_append_sheet(
      workbook: WorkBook,
      worksheet: WorkSheet,
      name: string,
    ): void;
    sheet_to_json<T = Record<string, unknown>>(worksheet: WorkSheet): T[];
  };
  export function read(
    data: unknown,
    options?: { type: string },
  ): { SheetNames: string[]; Sheets: Record<string, WorkSheet> };
  export function write(
    workbook: WorkBook,
    options: { type: "buffer"; bookType: "xlsx" },
  ): Buffer;
}
