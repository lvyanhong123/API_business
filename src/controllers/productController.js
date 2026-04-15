const db = require('../config/database');
const { validationResult } = require('express-validator');

exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, name, description, supplier, pricingType, pricePerCall, subscriptionPrice, dailyLimit, monthlyLimit } = req.body;

  try {
    const supplierExists = db.suppliers.findById(supplier);
    if (!supplierExists) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    const existing = db.products.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: '产品编码已存在' });
    }

    const product = db.products.create({
      code, name, description, supplierId: supplier, pricingType,
      pricePerCall: pricePerCall || 0, subscriptionPrice: subscriptionPrice || 0,
      dailyLimit: dailyLimit || 0, monthlyLimit: monthlyLimit || 0, status: 'offline'
    });

    res.status(201).json({ message: '产品创建成功', product });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProducts = async (req, res) => {
  const { supplier, status, page = 1, limit = 10 } = req.query;

  try {
    let products = db.products.findAll();
    if (supplier) products = products.filter(p => p.supplierId === parseInt(supplier));
    if (status) products = products.filter(p => p.status === status);

    products = products.map(p => {
      const sup = db.suppliers.findById(p.supplierId);
      return { ...p, supplier: sup ? { id: sup.id, name: sup.name, type: sup.type } : null };
    });

    const total = products.length;
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), products: paginatedProducts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = db.products.findById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    const supplier = db.suppliers.findById(product.supplierId);
    res.status(200).json({ ...product, supplier });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { code, name, description, supplier, pricingType, pricePerCall, subscriptionPrice, dailyLimit, monthlyLimit, status } = req.body;

  try {
    const product = db.products.findById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    const updated = db.products.update(parseInt(id), {
      code: code || product.code,
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      supplierId: supplier || product.supplierId,
      pricingType: pricingType || product.pricingType,
      pricePerCall: pricePerCall !== undefined ? pricePerCall : product.pricePerCall,
      subscriptionPrice: subscriptionPrice !== undefined ? subscriptionPrice : product.subscriptionPrice,
      dailyLimit: dailyLimit !== undefined ? dailyLimit : product.dailyLimit,
      monthlyLimit: monthlyLimit !== undefined ? monthlyLimit : product.monthlyLimit,
      status: status || product.status
    });

    res.status(200).json({ message: '产品更新成功', product: updated });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = db.products.findById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    db.productChannels.deleteByProductId(parseInt(id));
    const deleted = db.products.delete(parseInt(id));

    res.status(200).json({ message: '产品删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProductChannels = async (req, res) => {
  const { id } = req.params;

  try {
    const product = db.products.findById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    const productChannels = db.productChannels.findByProductId(parseInt(id));
    const channels = productChannels.map(pc => {
      const channel = db.channels.findById(pc.channelId);
      return {
        id: pc.id,
        channelId: channel ? channel.id : null,
        channelName: channel ? channel.name : '-',
        isPrimary: pc.isPrimary,
        priority: pc.priority
      };
    });

    res.status(200).json({ productId: parseInt(id), channels });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.addProductChannel = async (req, res) => {
  const { id } = req.params;
  const { channelId, isPrimary = true, priority = 1 } = req.body;

  try {
    const product = db.products.findById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    const channel = db.channels.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: '通道不存在' });
    }

    const existing = db.productChannels.findByProductIdAndChannelId(parseInt(id), channelId);
    if (existing) {
      return res.status(400).json({ message: '该通道已配置到该产品' });
    }

    const productChannel = db.productChannels.create({
      productId: parseInt(id),
      channelId,
      isPrimary,
      priority
    });

    res.status(201).json({ message: '通道添加成功', productChannel });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.removeProductChannel = async (req, res) => {
  const { id, channelId } = req.params;

  try {
    const productChannel = db.productChannels.findByProductIdAndChannelId(parseInt(id), parseInt(channelId));
    if (!productChannel) {
      return res.status(404).json({ message: '产品通道关联不存在' });
    }

    db.productChannels.delete(productChannel.id);

    res.status(200).json({ message: '通道移除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};