import { initializeTelegramSDK } from './utils/telegram';

interface ApiPayload {
  action: string;
  initData: string;
  username_bankcode?: string;
  telegram_chat_id?: number;
  data?: any;
  [key: string]: any;
}

export async function callBackendApi<T = any>(payload: Omit<ApiPayload, 'initData'>): Promise<T> {
  const session = initializeTelegramSDK();
  const fullPayload: ApiPayload = {
    ...payload,
    initData: session.rawInitData,
  };

  // If there's a telegram user ID, link it automatically for get_deposits
  if (payload.action === 'get_deposits' && session.user && !payload.telegram_chat_id) {
    fullPayload.telegram_chat_id = session.user.id;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error("VITE_API_URL chưa được định nghĩa trong biến môi trường.");
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Tránh CORS preflight
    },
    body: JSON.stringify(fullPayload),
  });

  if (!response.ok) {
    throw new Error(`Lỗi kết nối API: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message || "Đã xảy ra lỗi từ API backend.");
  }
  return result.data as T;
}
