const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" });

export function formatDate(value: string | Date) {
  return dateFormat.format(typeof value === "string" ? new Date(value) : value);
}
