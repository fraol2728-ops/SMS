const ET_MONTHS = [
  "Meskerem",
  "Tikemt",
  "Hidar",
  "Tahsas",
  "Ter",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
];

export function toEthiopianDate(date: Date): string {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  let etYear = gYear - 8;
  let etMonth: number;

  if (gMonth > 9 || (gMonth === 9 && gDay >= 11)) {
    etYear = gYear - 7;
  }

  const etNewYearGregorian = new Date(gYear, 8, 11);
  let diffDays = Math.floor(
    (date.getTime() - etNewYearGregorian.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    const prevNewYear = new Date(gYear - 1, 8, 11);
    diffDays = Math.floor(
      (date.getTime() - prevNewYear.getTime()) / (1000 * 60 * 60 * 24),
    );
    etYear = gYear - 8;
  }

  etMonth = Math.floor(diffDays / 30) + 1;
  const etDay = (diffDays % 30) + 1;

  if (etMonth > 13) etMonth = 13;
  if (etMonth < 1) etMonth = 1;

  const monthName = ET_MONTHS[etMonth - 1] ?? "Meskerem";
  return `${etDay} ${monthName} ${etYear}`;
}

export function formatDate(
  date: Date | string | null | undefined,
  calendarSystem = "gregorian",
  format = "DD/MM/YYYY",
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  if (calendarSystem === "ethiopian") return toEthiopianDate(d);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (format === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (format === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}
