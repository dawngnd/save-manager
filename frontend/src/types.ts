export interface User {
  username_bankcode: string;
  telegram_chat_id?: string;
  type?: 'bank' | 'gold';
  statics?: number; // 1 = tính vào tổng tài sản, 0 = không
}

export interface Deposit {
  id: string;
  amount: number;
  interest_rate: number;
  status: 'active' | 'matured' | 'rolled_over';
  expected_interest: number;
  created_at: string; // format: DD/MM/YYYY
  maturity_at: string; // format: DD/MM/YYYY
  user_bankcode: string;
  parent_id: string; // ID khoản gốc (trống nếu là khoản đầu tiên)
  child_id: string;  // ID khoản con đã tái tục (trống nếu chưa tái tục)
}

export interface GoldRecord {
  id: string;
  purchase_date: string; // format: DD/MM/YYYY
  price_per_chi: number; // giá mua 1 chỉ (100g) tại thời điểm mua
  quantity_gram: number; // số gram
  user_bankcode: string;
  provider: string;
}

export interface GoldPrice {
  price_per_chi: number; // giá hiện tại 1 chỉ (100g)
  updated_at: string;
}
