const db = require('../config/database');
const axios = require('axios');
const { calculateCost } = require('../services/costCalculator');

function checkAndRenewQuota(accountId, productId, customerId, paymentType) {
  if (!accountId || paymentType === 'postpay') return null;

  const quota = db.accountProductQuotas.findOne({ accountId, productId });
  if (!quota) return null;

  const autoRenewal = db.autoRenewalConfigs.findOne({
    accountId,
    productId,
    enabled: true
  });

  if (!autoRenewal) return null;

  const product = db.products.findById(productId);
  if (!product || product.orderType !== 'per_call') return null;

  let triggerValue = 0;
  if (autoRenewal.triggerType === 'ratio') {
    const totalPrepay = quota.prepayRemaining + quota.postpayConsumed;
    if (totalPrepay === 0) return null;
    triggerValue = quota.prepayRemaining / totalPrepay * 100;
  } else {
    triggerValue = quota.prepayRemaining;
  }

  const shouldRenew = autoRenewal.triggerType === 'ratio'
    ? triggerValue <= autoRenewal.triggerValue
    : triggerValue <= autoRenewal.triggerValue;

  if (!shouldRenew) return null;

  const account = db.customerAccounts.findByCustomerId(customerId);
  if (!account) return null;

  const renewCost = product.pricePerCall * autoRenewal.renewQuantity;
  if (account.balance < renewCost) return null;

  db.customerAccounts.update(account.id, { balance: account.balance - renewCost });

  const order = db.orders.create({
    orderNo: 'AUTO' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    customerId,
    accountId,
    productId,
    orderType: 'per_call',
    quantity: autoRenewal.renewQuantity,
    amount: renewCost,
    paymentType: 'prepay',
    paymentMethod: 'balance',
    reviewStatus: 'approved',
    paymentStatus: 'paid',
    paidAt: new Date(),
    autoRenewed: true
  });

  db.accountProductQuotas.update(quota.id, {
    prepayRemaining: quota.prepayRemaining + autoRenewal.renewQuantity
  });

  return order;
}

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
    const accountId = req.accountId || null;
    const keyRecord = req.keyRecord || null;

    if (product.pricingType === 'per_call') {
      let hasQuota = false;
      let quotaType = null;

      if (accountId) {
        const quota = db.accountProductQuotas.findOne({
          accountId,
          productId: product.id
        });

        if (quota) {
          if (quota.prepayRemaining > 0) {
            hasQuota = true;
            quotaType = 'prepay';
          } else if (quota.postpayConsumed < Infinity) {
            const totalPostpayOrders = db.orders.findAll().filter(o =>
              o.accountId === accountId &&
              o.productId === product.id &&
              o.paymentType === 'postpay' &&
              o.reviewStatus === 'approved'
            );
            const totalPostpay = totalPostpayOrders.reduce((sum, o) => sum + o.quantity, 0);

            if (quota.postpayConsumed < totalPostpay) {
              hasQuota = true;
              quotaType = 'postpay';
            }
          }
        }
      }

      if (!hasQuota) {
        if (accountId) {
          const autoRenewal = db.autoRenewalConfigs.findOne({
            accountId,
            productId: product.id,
            enabled: true
          });

          if (autoRenewal) {
            const renewedOrder = checkAndRenewQuota(accountId, product.id, customer.id, 'prepay');
            if (renewedOrder) {
              hasQuota = true;
              quotaType = 'prepay';
            }
          }
        }

        if (!hasQuota) {
          return res.status(403).json({ error: '配额不足', code: 'QUOTA_EXHAUSTED' });
        }
      }

      if (accountId) {
        const quota = db.accountProductQuotas.findOne({
          accountId,
          productId: product.id
        });

        if (quota) {
          if (quotaType === 'prepay') {
            db.accountProductQuotas.update(quota.id, {
              prepayRemaining: quota.prepayRemaining - 1
            });
          } else if (quotaType === 'postpay') {
            db.accountProductQuotas.update(quota.id, {
              postpayConsumed: quota.postpayConsumed + 1
            });
          }
        }
      }
    } else if (product.pricingType === 'subscription') {
      const activeSubscription = db.orders.findOne({
        customerId: customer.id,
        productId: product.id,
        reviewStatus: 'approved',
        paymentStatus: 'paid',
        orderType: 'subscription'
      });

      if (!activeSubscription || (activeSubscription.validTo && new Date(activeSubscription.validTo) < new Date())) {
        return res.status(403).json({ error: '订阅已过期', code: 'SUBSCRIPTION_EXPIRED' });
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
      accountId: accountId,
      productId: product.id,
      supplierId: supplier.id,
      apiKeyId: keyRecord ? keyRecord.id : null,
      paymentType: quotaType || 'postpay',
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
        accountId: accountId,
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
    console.error('invokeApi error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};