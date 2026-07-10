import { init, isTMA, retrieveLaunchParams, retrieveRawInitData } from '@telegram-apps/sdk';

export interface TelegramSession {
  rawInitData: string;
  user: {
    id: number;
    username?: string;
    firstName?: string;
  } | null;
  isMock: boolean;
}

export function initializeTelegramSDK(): TelegramSession {
  try {
    init();
    if (isTMA()) {
      const rawInitData = retrieveRawInitData() || "";
      const lp = retrieveLaunchParams() as any;
      const user = lp.initData?.user || null;
      return {
        rawInitData,
        user: user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName
        } : null,
        isMock: false,
      };
    }
  } catch (e) {
    console.warn("Telegram SDK không khả dụng. Chuyển sang chế độ Local Mock Dev.", e);
  }

  // Fallback Mock Data phục vụ dev ngoài telegram bot
  return {
    rawInitData: "query_id=mock_query&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Admin%22%2C%22username%22%3A%22admin_test%22%7D&auth_date=1719999999&hash=mock_hash",
    user: {
      id: 123456789,
      username: "admin_test",
      firstName: "Admin",
    },
    isMock: true,
  };
}
