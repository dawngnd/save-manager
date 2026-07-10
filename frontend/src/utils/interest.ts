/**
 * Chuyển đổi chuỗi DD/MM/YYYY thành đối tượng Date client
 */
export function parseClientDateString(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error('Định dạng ngày không hợp lệ. Phải là DD/MM/YYYY');
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Tính số ngày gửi thực tế giữa hai chuỗi ngày DD/MM/YYYY
 */
export function calculateDaysBetween(startStr: string, endStr: string): number {
  const start = parseClientDateString(startStr);
  const end = parseClientDateString(endStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Tính lãi dự kiến realtime
 */
export function calculateExpectedInterest(amount: number, rate: number, startStr: string, endStr: string): number {
  try {
    const days = calculateDaysBetween(startStr, endStr);
    if (days <= 0 || amount <= 0 || rate <= 0) return 0;
    
    // Công thức tính lãi của dự án: expected_interest = amount * (rate / 100) * (days / 365)
    const interest = amount * (rate / 100) * (days / 365);
    return Math.round(interest);
  } catch {
    return 0;
  }
}
