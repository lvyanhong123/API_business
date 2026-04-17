const axios = require('axios');
const crypto = require('crypto');

async function proxyRequest(supplier, requestParams) {
  const { apiUrl, authType, authConfig } = supplier;

  let headers = {
    'Content-Type': 'application/json'
  };

  if (authType === 'apiKey') {
    headers['X-API-Key'] = authConfig;
  } else if (authType === 'bearer') {
    headers['Authorization'] = `Bearer ${authConfig}`;
  }

  const startTime = Date.now();
  try {
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      data: requestParams,
      headers,
      timeout: 30000
    });
    const duration = Date.now() - startTime;

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      errorMessage: error.message,
      statusCode: error.response ? error.response.status : 500,
      duration
    };
  }
}

function calculateFee(product, orderType) {
  if (orderType === 'per_call') {
    return product.pricePerCall;
  }
  return 0;
}

module.exports = {
  proxyRequest,
  calculateFee
};