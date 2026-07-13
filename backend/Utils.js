/**
 * Utils.js — Các lớp tiện ích dùng chung: xử lý ngày tháng và tạo response.
 */

class DateUtils {
  /**
   * Chuyển đổi chuỗi ngày DD/MM/YYYY thành đối tượng Date (00:00:00).
   * @param {string|Date} dateStr
   * @returns {Date}
   */
  static parse(dateStr) {
    // Google Sheets có thể tự chuyển text thành Date object
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) {
        throw new Error('Giá trị Date object không hợp lệ.');
      }
      return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate(), 0, 0, 0, 0);
    }

    // Chuyển về string nếu cần
    dateStr = String(dateStr).trim();

    if (!DATE_FORMAT_REGEX.test(dateStr)) {
      throw new Error('Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY');
    }
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Tháng trong JS tính từ 0-11
    const year = parseInt(parts[2], 10);

    const parsedDate = new Date(year, month, day, 0, 0, 0, 0);
    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month || parsedDate.getDate() !== day) {
      throw new Error('Giá trị ngày không hợp lệ: ' + dateStr);
    }
    return parsedDate;
  }

  /**
   * Tính số ngày chênh lệch thực tế giữa hai chuỗi ngày DD/MM/YYYY.
   * @param {string} startDateStr
   * @param {string} endDateStr
   * @returns {number}
   */
  static daysDifference(startDateStr, endDateStr) {
    const start = DateUtils.parse(startDateStr);
    const end = DateUtils.parse(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / MS_PER_DAY);

    if (diffDays <= 0) {
      throw new Error('Ngày đáo hạn phải sau ngày tạo khoản gửi.');
    }
    return diffDays;
  }
}

class ResponseHelper {
  /**
   * Tạo JSON response chuẩn cho API.
   * @param {string} status 'success' hoặc 'error'
   * @param {any} messageOrData Dữ liệu (success) hoặc thông báo lỗi (error)
   * @returns {GoogleAppsScript.Content.TextOutput|object}
   */
  static json(status, messageOrData) {
    const responseObj = { status: status };
    if (status === 'success') {
      responseObj.data = messageOrData;
    } else {
      responseObj.message = messageOrData;
    }

    if (typeof ContentService === 'undefined') {
      return responseObj;
    }

    return ContentService.createTextOutput(JSON.stringify(responseObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
