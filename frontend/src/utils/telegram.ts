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

export async function initializeTelegramSDK(): Promise<TelegramSession> {
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
  const mockUser = {
    id: 123456789,
    first_name: "Admin",
    username: "admin_test"
  };
  
  const authDate = Math.floor(Date.now() / 1000);
  const userJson = JSON.stringify(mockUser);
  
  const dataParams: Record<string, string> = {
    auth_date: authDate.toString(),
    query_id: "mock_query",
    user: userJson
  };

  const dataCheckString = Object.keys(dataParams)
    .sort()
    .map(key => `${key}=${dataParams[key]}`)
    .join("\n");

  const botToken = import.meta.env.VITE_TEST_BOT_TOKEN || "test_token";

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const secretKeyBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(botToken)
  );

  const hashKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    hashKey,
    encoder.encode(dataCheckString)
  );
  
  const hash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const rawInitData = `query_id=${dataParams.query_id}&user=${encodeURIComponent(userJson)}&auth_date=${authDate}&hash=${hash}`;

  return {
    rawInitData,
    user: {
      id: mockUser.id,
      username: mockUser.username,
      firstName: mockUser.first_name,
    },
    isMock: true,
  };
}
