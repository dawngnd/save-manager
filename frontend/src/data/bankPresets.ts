export interface BankPreset {
  id: string;
  name: string;
  promoRate: number;    // %/năm
  promoMonths: number;  // tháng
  floatingRate: number; // %/năm
  description?: string;
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'vietcombank',
    name: 'Vietcombank',
    promoRate: 9.6,
    promoMonths: 12,
    floatingRate: 12.5,
    description: 'Gói ưu đãi 12 tháng cố định (9.6%)'
  },
  {
    id: 'bidv',
    name: 'BIDV',
    promoRate: 9.7,
    promoMonths: 12,
    floatingRate: 13.0,
    description: 'Gói ưu đãi 12 tháng cố định (9.7%)'
  },
  {
    id: 'vietinbank',
    name: 'Vietinbank',
    promoRate: 10.0,
    promoMonths: 12,
    floatingRate: 13.5,
    description: 'Gói ưu đãi 12 tháng cố định (10.0%)'
  },
  {
    id: 'vpbank',
    name: 'VPBank',
    promoRate: 10.5,
    promoMonths: 12,
    floatingRate: 14.0,
    description: 'Gói ưu đãi linh hoạt 12 tháng (10.5%)'
  },
  {
    id: 'custom',
    name: 'Tùy chỉnh (Custom)',
    promoRate: 0,
    promoMonths: 0,
    floatingRate: 0,
    description: 'Tự nhập các tham số lãi suất'
  }
];
