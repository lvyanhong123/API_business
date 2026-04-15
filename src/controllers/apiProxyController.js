const db = require('../config/database');
const axios = require('axios');
const { calculateCost } = require('../services/costCalculator');

exports.invokeApi = async (req, res) => {
  const { productCode } = req.params;
  const requestParams = req.body;

  try {
    const product = db.products.findOne({ code: productCode });
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    if (product.status !== 'online') {
      return res.status(400).json({ error: '产品已下线' });
    }

    const supplier = db.suppliers.findById(product.supplierId);
    if (!supplier || supplier.status !== 'active') {
      return res.status(503).json({ error: '服务暂不可用' });
    }

    const customer = req.customer;

    if (product.pricingType === 'per_call') {
      const activeOrder = db.orders.findOne({
        customerId: customer.id,
        productId: product.id,
        reviewStatus: 'approved',
        paymentStatus: 'paid',
        orderType: 'per_call'
      });

      if (!activeOrder) {
        return res.status(403).json({ error: '暂无配额，请先购买服务' });
      }

      const usedQuota = db.apiLogs.count({
        customerId: customer.id,
        productId: product.id,
        success: true
      });

      if (usedQuota >= activeOrder.quantity) {
        return res.status(403).json({ error: '配额已用完，请续费' });
      }

      if (customer.quota <= 0) {
        return res.status(403).json({ error: '余额不足' });
      }

      db.customers.update(customer.id, { quota: customer.quota - 1 });
    } else if (product.pricingType === 'subscription') {
      const activeSubscription = db.orders.findOne({
        customerId: customer.id,
        productId: product.id,
        reviewStatus: 'approved',
        paymentStatus: 'paid',
        orderType: 'subscription'
      });

      if (!activeSubscription || (activeSubscription.validTo && new Date(activeSubscription.validTo) < new Date())) {
        return res.status(403).json({ error: '订阅已过期，请续费' });
      }
    }

    let result = { success: false, errorMessage: '供应商响应为空', statusCode: 500, duration: 0 };
    const startTime = Date.now();

    try {
      const response = await axios({
        method: 'POST',
        url: supplier.apiUrl,
        data: requestParams,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      result = { success: true, data: response.data, statusCode: response.status, duration: Date.now() - startTime };
    } catch (error) {
      result = { success: false, errorMessage: error.message, statusCode: error.response ? error.response.status : 500, duration: Date.now() - startTime };
    }

    const fee = product.pricingType === 'per_call' ? product.pricePerCall : 0;

    const log = db.apiLogs.create({
      customerId: customer.id,
      productId: product.id,
      supplierId: supplier.id,
      requestParams,
      responseData: result.data || null,
      statusCode: result.statusCode,
      success: result.success,
      errorMessage: result.errorMessage || null,
      duration: result.duration,
      fee
    });

    const channels = db.channels.findBySupplier(supplier.id);
    const channel = channels.find(c => c.apiUrl === supplier.apiUrl);
    if (channel) {
      const responseParams = result.data || {};
      const cost = calculateCost(channel, requestParams, responseParams);

      db.callLogs.create({
        channelId: channel.id,
        supplierId: supplier.id,
        customerId: customer.id,
        productId: product.id,
        callTime: new Date().toISOString(),
        requestParams,
        responseParams,
        responseCode: String(result.statusCode),
        responseTime: result.duration,
        cost,
        success: result.success
      });
    }

    if (!result.success) {
      return res.status(result.statusCode).json({ error: result.errorMessage });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      logId: log.id,
      duration: result.duration
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};