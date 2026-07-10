/**
 * Định dạng chuỗi ngày tháng nhập vào dạng DD/MM/YYYY tự động
 * @param value Giá trị hiện tại của input
 * @param prevValue Giá trị trước đó để phát hiện nút xóa
 */
export function formatMaskDate(value: string, prevValue: string): string {
  const clean = value.replace(/\D/g, "");
  
  // Phát hiện xóa ký tự phân tách '/'
  if (value.length < prevValue.length && (prevValue.endsWith('/') || prevValue.length === 3 || prevValue.length === 6)) {
    return value;
  }
  
  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
}
