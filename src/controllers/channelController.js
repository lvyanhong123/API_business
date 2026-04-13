const db = require('../config/database');
const { validationResult } = require('express-validator');

exports.createChannel = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, supplierId, apiUrl, authType, authConfig, pricingType, pricePerCall, subscriptionPrice, status } = req.body;

  try {
    const supplier = db.suppliers.findById(parseInt(supplierId));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    const channel = db.channels.create({
      name,
      supplierId: parseInt(supplierId),
      apiUrl,
      authType,
      authConfig,
      pricingType: pricingType || 'per_call',
      pricePerCall: pricePerCall ? parseFloat(pricePerCall) : 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : 0,
      status: status || 'active'
    });

    res.status(201).json({ message: '通道创建成功', channel });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getChannels = async (req, res) => {
  const { supplierId, status, page = 1, limit = 100 } = req.query;

  try {
    let channels = db.channels.findAll();
    
    if (supplierId) {
      channels = channels.filter(c => c.supplierId === parseInt(supplierId));
    }
    if (status) {
      channels = channels.filter(c => c.status === status);
    }

    channels.forEach(c => {
      const supplier = db.suppliers.findById(c.supplierId);
      c.supplierName = supplier ? supplier.name : '-';
    });

    const total = channels.length;
    const start = (page - 1) * limit;
    const paginatedChannels = channels.slice(start, start + parseInt(limit));

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      channels: paginatedChannels
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getChannelsBySupplier = async (req, res) => {
  const { supplierId } = req.params;

  try {
    const supplier = db.suppliers.findById(parseInt(supplierId));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    const channels = db.channels.findBySupplier(parseInt(supplierId));

    res.status(200).json({
      supplier,
      channels
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getChannel = async (req, res) => {
  const { id } = req.params;

  try {
    const channel = db.channels.findById(parseInt(id));
    if (!channel) {
      return res.status(404).json({ message: '通道不存在' });
    }

    const supplier = db.suppliers.findById(channel.supplierId);
    channel.supplierName = supplier ? supplier.name : '-';

    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateChannel = async (req, res) => {
  const { id } = req.params;
  const { name, apiUrl, authType, authConfig, pricingType, pricePerCall, subscriptionPrice, status } = req.body;

  try {
    const channel = db.channels.findById(parseInt(id));
    if (!channel) {
      return res.status(404).json({ message: '通道不存在' });
    }

    const updated = db.channels.update(parseInt(id), {
      name: name || channel.name,
      apiUrl: apiUrl || channel.apiUrl,
      authType: authType || channel.authType,
      authConfig: authConfig !== undefined ? authConfig : channel.authConfig,
      pricingType: pricingType || channel.pricingType,
      pricePerCall: pricePerCall !== undefined ? parseFloat(pricePerCall) : channel.pricePerCall,
      subscriptionPrice: subscriptionPrice !== undefined ? parseFloat(subscriptionPrice) : channel.subscriptionPrice,
      status: status || channel.status
    });

    res.status(200).json({ message: '通道更新成功', channel: updated });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deleteChannel = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = db.channels.delete(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ message: '通道不存在' });
    }

    res.status(200).json({ message: '通道删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
