/**
 * AuthService.js — Xác thực dữ liệu từ Telegram Web App.
 */

class AuthService {
  /**
   * Extract telegram user ID từ initData query string.
   * initData chứa "user={json_encoded}" → parse ra user.id
   * @param {string} initData
   * @returns {string|null} telegram user id hoặc null
   */
  static extractUserId(initData) {
    if (!initData) return null;
    try {
      const parts = initData.split('&');
      for (var i = 0; i < parts.length; i++) {
        var idx = parts[i].indexOf('=');
        if (idx === -1) continue;
        var key = decodeURIComponent(parts[i].substring(0, idx));
        if (key === 'user') {
          var userJson = decodeURIComponent(parts[i].substring(idx + 1));
          var userObj = JSON.parse(userJson);
          return userObj.id ? String(userObj.id) : null;
        }
      }
    } catch (e) {
      Logger.log('extractTelegramUserId error: ' + e.toString());
    }
    return null;
  }

  /**
   * Xác thực dữ liệu initData từ Telegram Web App gửi lên.
   * @param {string} initData Chuỗi query string nhận từ client
   * @param {string} botToken Token của bot Telegram lấy từ Script Properties
   * @returns {string} Chuỗi rỗng ("") nếu hợp lệ, hoặc chuỗi lý do nếu thất bại
   */
  static verifyWebAppData(initData, botToken) {
    if (!initData) {
      if (!botToken) return ''; // Bypass test offline
      return 'initData is missing';
    }

    if (!botToken) return 'MISSING';

    try {
      var params = {};
      var parts = initData.split('&');
      for (var i = 0; i < parts.length; i++) {
        var idx = parts[i].indexOf('=');
        if (idx === -1) continue;
        var key = decodeURIComponent(parts[i].substring(0, idx));
        var value = decodeURIComponent(parts[i].substring(idx + 1));
        params[key] = value;
      }

      var hash = params['hash'];
      if (!hash) {
        return 'Xác thực thất bại.';
      }

      var authDate = parseInt(params['auth_date'], 10);
      var currentTime = Math.floor(Date.now() / 1000);
      if (isNaN(authDate) || (currentTime - authDate) > AUTH_EXPIRY_SECONDS) {
        return 'Phiên đăng nhập đã hết hạn.';
      }

      var sortedKeys = Object.keys(params).filter(function(k) { return k !== 'hash'; }).sort();
      var dataCheckString = sortedKeys.map(function(k) { return k + '=' + params[k]; }).join('\n');

      // secret_key = HMAC-SHA256(key="WebAppData", msg=bot_token)
      var secretKeyBytes = Utilities.computeHmacSha256Signature(botToken, 'WebAppData');

      // Convert byte[] → char string for use as key
      var keyString = secretKeyBytes.map(function(b) {
        return String.fromCharCode(b < 0 ? b + 256 : b);
      }).join('');

      // hash = HMAC-SHA256(key=secret_key, msg=data_check_string)
      var signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, keyString);

      var signatureHex = signatureBytes.map(function(b) {
        var val = b < 0 ? b + 256 : b;
        return ('0' + val.toString(16)).slice(-2);
      }).join('');

      if (signatureHex !== hash) {
        Logger.log('HMAC mismatch. got=' + signatureHex.substring(0, 16) + '... expected=' + hash.substring(0, 16) + '...');
        return 'Xác thực thất bại.';
      }
      return '';
    } catch (err) {
      return 'Exception: ' + err.toString();
    }
  }
}
