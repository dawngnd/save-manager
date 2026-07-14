/**
 * GoldRepository.js — CRUD operations và business logic cho bảng Gold.
 */

class GoldRepository {
  /**
   * Sinh ID ngẫu nhiên cho bản ghi vàng: gold-{timestamp}-{random}
   * @returns {string}
   */
  static generateId() {
    var randomStr = Math.random().toString(36).substring(2, 8);
    return 'gold-' + Date.now() + '-' + randomStr;
  }

  /**
   * Thêm bản ghi mua vàng mới.
   * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, gold: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @param {object} payload
   * @returns {GoogleAppsScript.Content.TextOutput}
   */
  static add(sheets, payload) {
    var data = payload.data;

    if (!data || !data.purchase_date || !data.price_per_chi || !data.quantity_gram || !data.user_bankcode) {
      throw new Error('Thiếu dữ liệu bản ghi vàng.');
    }

    var pricePerChi  = Number(data.price_per_chi);
    var quantityGram = Number(data.quantity_gram);

    if (isNaN(pricePerChi) || pricePerChi <= 0) {
      throw new Error('Giá mua phải là số dương.');
    }
    if (isNaN(quantityGram) || quantityGram <= 0) {
      throw new Error('Số gram phải là số dương.');
    }
    if (!DATE_FORMAT_REGEX.test(data.purchase_date)) {
      throw new Error('Ngày mua không đúng định dạng DD/MM/YYYY.');
    }

    var id = GoldRepository.generateId();
    var newRow = [
      id,
      data.purchase_date,
      pricePerChi,
      quantityGram,
      data.user_bankcode,
      data.provider || ''
    ];

    sheets.gold.appendRow(newRow);
    Logger.log('Đã thêm bản ghi vàng: ' + id);

    return ResponseHelper.json('success', {
      id: id,
      purchase_date: data.purchase_date,
      price_per_chi: pricePerChi,
      quantity_gram: quantityGram,
      user_bankcode: data.user_bankcode,
      provider: data.provider || ''
    });
  }

  /**
   * Lấy danh sách tất cả bản ghi vàng.
   * @param {{gold: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @returns {GoogleAppsScript.Content.TextOutput}
   */
  static getAll(sheets) {
    var goldSheet = sheets.gold;
    var lastRow = goldSheet.getLastRow();
    var result = [];

    if (lastRow > HEADER_ROW) {
      var values = goldSheet.getRange(DATA_START_ROW, 1, lastRow - 1, GOLD_TOTAL_COLUMNS).getValues();
      for (var i = 0; i < values.length; i++) {
        if (!values[i][GOLD_COL_ID]) continue; // bỏ qua hàng trống
        result.push({
          id:             values[i][GOLD_COL_ID],
          purchase_date:  values[i][GOLD_COL_PURCHASE_DATE],
          price_per_chi:  Number(values[i][GOLD_COL_PRICE_PER_CHI]),
          quantity_gram:  Number(values[i][GOLD_COL_QUANTITY_GRAM]),
          user_bankcode:  values[i][GOLD_COL_USER_BANKCODE],
          provider:       values[i][GOLD_COL_PROVIDER] || ''
        });
      }
    }

    return ResponseHelper.json('success', result);
  }

  /**
   * Lấy giá vàng hiện tại từ API bên ngoài.
   * Kết quả được cache trong Script Properties để tránh gọi API liên tục.
   * @param {boolean} forceRefresh Bỏ qua cache, gọi API mới
   * @returns {GoogleAppsScript.Content.TextOutput}
   */
  static getCurrentPrice(forceRefresh) {
    var properties = PropertiesService.getScriptProperties();

    if (!forceRefresh) {
      var cached = properties.getProperty(PROP_GOLD_PRICE_CACHE);
      if (cached) {
        try {
          var cacheData = JSON.parse(cached);
          return ResponseHelper.json('success', cacheData);
        } catch (e) {
          // cache lỗi → gọi API mới
        }
      }
    }

    try {
      var response = UrlFetchApp.fetch(GOLD_API_URL, { muteHttpExceptions: true });
      var json = JSON.parse(response.getContentText());

      // API trả về mảng, lấy phần tử đầu tiên
      var item = Array.isArray(json) ? json[0] : json;
      if (!item || item.sell == null) {
        throw new Error('Dữ liệu API không hợp lệ.');
      }

      // Giá sell là giá cho 1 lượng, chia 100 để ra giá 1 chỉ (100g)
      var pricePerChi = Math.round(item.sell / 100);
      var result = {
        price_per_chi: pricePerChi,
        updated_at: new Date().toISOString()
      };

      // Lưu cache
      properties.setProperty(PROP_GOLD_PRICE_CACHE, JSON.stringify(result));
      Logger.log('Đã cập nhật giá vàng: ' + pricePerChi + ' VND/chỉ');

      return ResponseHelper.json('success', result);
    } catch (err) {
      Logger.log('Lỗi lấy giá vàng: ' + err.toString());
      return ResponseHelper.json('error', 'Không thể lấy giá vàng từ API.');
    }
  }
}
