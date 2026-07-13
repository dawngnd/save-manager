/**
 * Constants.js — Tập trung tất cả hằng số, tránh magic numbers rải rác trong codebase.
 */

// === TÊN SHEET ===
const SHEET_USERS = 'Users';
const SHEET_DEPOSITS = 'Deposits';

// === DEPOSITS: CHỈ SỐ CỘT (0-based, dùng khi truy cập mảng values[i][COL]) ===
const DEP_COL_ID = 0;
const DEP_COL_AMOUNT = 1;
const DEP_COL_INTEREST_RATE = 2;
const DEP_COL_STATUS = 3;
const DEP_COL_EXPECTED_INTEREST = 4;
const DEP_COL_CREATED_AT = 5;
const DEP_COL_MATURITY_AT = 6;
const DEP_COL_USER_BANKCODE = 7;
const DEP_COL_PARENT_ID = 8;
const DEP_COL_CHILD_ID = 9;
const DEP_TOTAL_COLUMNS = 10;

// === DEPOSITS: SỐ THỨ TỰ CỘT TRONG SHEET (1-based, dùng cho getRange) ===
const DEP_SHEET_COL_STATUS = DEP_COL_STATUS + 1;             // 4
const DEP_SHEET_COL_CREATED_AT = DEP_COL_CREATED_AT + 1;     // 6
const DEP_SHEET_COL_CHILD_ID = DEP_COL_CHILD_ID + 1;         // 10

// === USERS: CHỈ SỐ CỘT (0-based) ===
const USER_COL_BANKCODE = 0;
const USER_COL_CHAT_ID = 1;
const USER_TOTAL_COLUMNS = 2;

// === USERS: SỐ THỨ TỰ CỘT TRONG SHEET (1-based) ===
const USER_SHEET_COL_CHAT_ID = USER_COL_CHAT_ID + 1; // 2

// === TRẠNG THÁI KHOẢN GỬI ===
const STATUS_ACTIVE = 'active';
const STATUS_ROLLED_OVER = 'rolled_over';
const STATUS_MATURED = 'matured';

// === CẤU HÌNH ===
const HEADER_ROW = 1;
const DATA_START_ROW = 2;
const LOCK_TIMEOUT_MS = 10000;
const MATURITY_ALERT_DAYS = 3;
const AUTH_EXPIRY_SECONDS = 86400;
const DAYS_IN_YEAR = 365;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

// === KHÓA CẤU HÌNH SCRIPT PROPERTIES ===
const PROP_SPREADSHEET_ID = 'SPREADSHEET_ID';
const PROP_TELEGRAM_BOT_TOKEN = 'TELEGRAM_BOT_TOKEN';
const PROP_WEB_APP_URL = 'WEB_APP_URL';
const PROP_WEBHOOK_TOKEN = 'WEBHOOK_TOKEN';
const PROP_MINI_APP_URL = 'MINI_APP_URL';
const PROP_WORKER_SECRET = 'WORKER_SECRET';

// === HEADERS SHEET ===
const DEPOSITS_HEADERS = [
  'id', 'amount', 'interest_rate', 'status', 'expected_interest',
  'created_at', 'maturity_at', 'user_bankcode', 'parent_id', 'child_id'
];
const USERS_HEADERS = ['username_bankcode', 'telegram_chat_id'];

// === TELEGRAM ===
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
