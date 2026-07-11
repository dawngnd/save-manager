export interface User {
  username_bankcode: string;
  telegram_chat_id?: string;
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
}
