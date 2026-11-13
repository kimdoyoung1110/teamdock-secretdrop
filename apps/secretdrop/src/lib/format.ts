const dateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function formatDateTime(value: Date) {
  return dateTimeFormat.format(value);
}
