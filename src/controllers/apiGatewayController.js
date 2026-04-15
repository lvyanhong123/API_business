const db = require('../config/database');

exports.proxy = async (req, res) => {
  const { apiKey, productCode, ...params } = req.body;

  try {
    const apiKeyRecord = db.apiKeys.findByApiKey(apiKey);
    if (!apiKeyRecord) {
      return res.status(401).json({ success: false, code: 'INVALID_KEY', message: '无效的API Key' });
    }

    if (apiKeyRecord.status !== 'active') {
      return res.status(401).json({ success: false, code: 'KEY_REVOKED', message: 'API Key已被吊销' });
    }

    const product = db.products.findById(apiKeyRecord.productId);
    if (!product) {
      return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', message: '产品不存在' });
    }

    if (product.status !== 'online') {
      return res.status(400).json({ success: false, code: 'PRODUCT_OFFLINE', message: '产品已下线' });
    }

    const customer = db.customers.findById(apiKeyRecord.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, code: 'CUSTOMER_NOT_FOUND', message: '客户不存在' });
    }

    if (customer.status !== 'active') {
      return res.status(403).json({ success: false, code: 'CUSTOMER_INACTIVE', message: '账号已被禁用' });
    }

    let account = db.customerAccounts.findByCustomerId(customer.id);
    if (!account) {
      account = db.customerAccounts.create({
        customerId: customer.id,
        balance: 0,
        creditLimit: 0,
        paymentType: customer.paymentType || 'prepay'
      });
    }

    if (customer.paymentType === 'prepay' && account.balance <= 0) {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_BALANCE', message: '余额不足' });
    }

    if (customer.paymentType === 'postpay' && account.creditLimit > 0) {
      const oweAmount = await calculateOweAmount(customer.id);
      if (oweAmount >= account.creditLimit) {
        return res.status(402).json({ success: false, code: 'CREDIT_EXCEEDED', message: '已超过信用额度' });
      }
    }

    const productChannels = db.productChannels.findByProductId(product.id);
    if (!productChannels || productChannels.length === 0) {
      return res.status(500).json({ success: false, code: 'NO_CHANNEL', message: '产品未配置通道' });
    }

    const sortedChannels = productChannels.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.priority - b.priority;
    });

    let success = false;
    let usedChannel = null;
    let responseData = null;
    let lastError = null;

    for (const pc of sortedChannels) {
      const channel = db.channels.findById(pc.channelId);
      if (!channel || channel.status !== 'online') continue;

      try {
        const channelResponse = await callChannel(channel, params);

        if (channelResponse.success) {
          success = true;
          usedChannel = channel;
          responseData = channelResponse;
          break;
        } else if (channelResponse.shouldFallback) {
          lastError = channelResponse;
          continue;
        } else {
          usedChannel = channel;
          responseData = channelResponse;
          break;
        }
      } catch (error) {
        lastError = { success: false, code: 'CHANNEL_ERROR', message: error.message };
        continue;
      }
    }

    const callLog = db.apiLogs.create({
      customerId: customer.id,
      productId: product.id,
      channelId: usedChannel ? usedChannel.id : null,
      channelName: usedChannel ? usedChannel.name : null,
      requestParams: params,
      responseParams: responseData,
      responseCode: responseData?.code || 'UNKNOWN',
      responseMessage: responseData?.message || '',
      responseTime: responseData?.responseTime || 0,
      success: success,
      callTime: new Date().toISOString()
    });

    if (success && product.pricingType === 'per_call') {
      const cost = product.pricePerCall;
      if (customer.paymentType === 'prepay') {
        db.customerAccounts.update(account.id, { balance: account.balance - cost });
      }
    }

    res.status(200).json({
      success,
      code: responseData?.code || 'UNKNOWN',
      message: responseData?.message || (success ? '成功' : '失败'),
      data: responseData?.data || null,
      channel: usedChannel ? usedChannel.name : null,
      callId: callLog.id
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: '服务器错误' });
  }
};

async function callChannel(channel, params) {
  const startTime = Date.now();

  try {
    const response = await fetch(channel.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    const mapping = db.responseCodeMappings.findByChannelIdAndSourceCode(channel.id, data.code);
    const mappedCode = mapping ? mapping.targetCode : data.code;
    const mappedMessage = mapping ? mapping.targetMessage : data.message;

    const isSuccess = mappedCode === '00' || data.success === true;
    const shouldFallback = !isSuccess && (responseTime > (channel.timeout || 5000) || data.retryable === true);

    return {
      success: isSuccess,
      code: mappedCode,
      message: mappedMessage,
      data: data.data || null,
      responseTime,
      shouldFallback,
      originalResponse: data
    };
  } catch (error) {
    return {
      success: false,
      code: 'CHANNEL_ERROR',
      message: error.message,
      responseTime: Date.now() - startTime,
      shouldFallback: true
    };
  }
}

async function calculateOweAmount(customerId) {
  const logs = db.apiLogs.findAll().filter(l => l.customerId === customerId);
  let total = 0;
  for (const log of logs) {
    const product = db.products.findById(log.productId);
    if (product && product.pricingType === 'per_call') {
      total += product.pricePerCall;
    }
  }
  return total;
}

exports.getChannels = async (req, res) => {
  try {
    const channels = db.channels.findAll();
    res.status(200).json({ channels });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.addMapping = async (req, res) => {
  const { channelId, sourceCode, sourceMessage, targetCode, targetMessage } = req.body;

  try {
    const channel = db.channels.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: '通道不存在' });
    }

    const mapping = db.responseCodeMappings.create({
      channelId,
      sourceCode,
      sourceMessage: sourceMessage || '',
      targetCode,
      targetMessage: targetMessage || ''
    });

    res.status(201).json({ message: '映射添加成功', mapping });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getMappings = async (req, res) => {
  const { channelId } = req.query;

  try {
    let mappings;
    if (channelId) {
      mappings = db.responseCodeMappings.findByChannelId(parseInt(channelId));
    } else {
      mappings = db.responseCodeMappings.findAll();
    }

    mappings = mappings.map(m => {
      const channel = db.channels.findById(m.channelId);
      return { ...m, channelName: channel ? channel.name : '-' };
    });

    res.status(200).json({ mappings });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deleteMapping = async (req, res) => {
  const { id } = req.params;

  try {
    db.responseCodeMappings.delete(parseInt(id));
    res.status(200).json({ message: '映射删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};