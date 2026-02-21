/**
 * Parse JWT Token
 * @param {string} token - JWT Token
 * @returns {object} Parsed JWT {header, payload, signature}
 */
function parseJWT(token) {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signature) {
      throw new Error('Invalid JWT format');
    }
    
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    return {
      header,
      payload,
      signature,
    };
  } catch (error) {
    console.error('Error parsing JWT:', error);
    throw error;
  }
}

/**
 * Lấy expiration time từ JWT Token
 * @param {string} token - JWT Token
 * @returns {Date} Expiration date
 */
function getJWTExpiration(token) {
  try {
    const { payload } = parseJWT(token);
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting JWT expiration:', error);
    return null;
  }
}

/**
 * Check xem JWT Token có hết hạn không
 * @param {string} token - JWT Token
 * @returns {boolean} true nếu hết hạn
 */
function isJWTExpired(token) {
  try {
    const expirationDate = getJWTExpiration(token);
    return expirationDate < new Date();
  } catch (error) {
    return true;
  }
}

/**
 * Format JWT Expiration thành readable string
 * @param {string} token - JWT Token
 * @returns {string} Formatted expiration date
 */
function formatJWTExpiration(token) {
  try {
    const expirationDate = getJWTExpiration(token);
    if (!expirationDate) return 'Invalid';
    
    return expirationDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return 'Invalid';
  }
}

export {
  parseJWT,
  getJWTExpiration,
  isJWTExpired,
  formatJWTExpiration,
};
