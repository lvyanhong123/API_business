const db = require('../config/database');
const { validationResult } = require('express-validator');

function generateOrderNo() {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

exports.createOrder = async (req, res) => {
  const { product, orderType, quantity = 1 } = req.body;

  if (!product || !orderType) {
    return res.status(400).json({ message: '请选择产品和订单类型' });
  }

  try {
    const productInfo = db.products.findById(product);
    if (!productInfo) {
      return res.status(404).json({ message: '产品不存在' });
    }

    if (productInfo.status !== 'online') {
      return res.status(400).json({ message: '产品已下线' });
    }

    let amount = 0;
    let validFrom = null;
    let validTo = null;

    if (orderType === 'per_call') {
      amount = productInfo.pricePerCall * quantity;
    } else if (orderType === 'subscription') {
      amount = productInfo.subscriptionPrice;
      validFrom = new Date();
      validTo = new Date();
      validTo.setMonth(validTo.getMonth() + quantity);
    }

    const order = db.orders.create({
      orderNo: generateOrderNo(),
      customerId: req.customer.id,
      productId: product,
      orderType,
      quantity,
      amount,
      validFrom,
      validTo,
      reviewStatus: 'pending',
      paymentStatus: 'pending'
    });

    res.status(201).json({ message: '订单创建成功', order });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getOrders = async (req, res) => {
  const { reviewStatus, paymentStatus, page = 1, limit = 10 } = req.query;

  try {
    let orders = db.orders.findAll().filter(o => o.customerId === req.customer.id);
    if (reviewStatus) orders = orders.filter(o => o.reviewStatus === reviewStatus);
    if (paymentStatus) orders = orders.filter(o => o.paymentStatus === paymentStatus);

    orders = orders.map(o => {
      const p = db.products.findById(o.productId);
      return { ...o, product: p ? { id: p.id, code: p.code, name: p.name, pricingType: p.pricingType, pricePerCall: p.pricePerCall, subscriptionPrice: p.subscriptionPrice } : null };
    });

    const total = orders.length;
    const start = (page - 1) * limit;
    orders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = db.orders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.customerId !== req.customer.id) {
      return res.status(403).json({ message: '无权访问此订单' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getAllOrders = async (req, res) => {
  const { reviewStatus, paymentStatus, page = 1, limit = 10 } = req.query;

  try {
    let orders = db.orders.findAll();
    if (reviewStatus) orders = orders.filter(o => o.reviewStatus === reviewStatus);
    if (paymentStatus) orders = orders.filter(o => o.paymentStatus === paymentStatus);

    orders = orders.map(o => {
      const c = db.customers.findById(o.customerId);
      const p = db.products.findById(o.productId);
      return {
        ...o,
        customer: c ? { id: c.id, companyName: c.companyName, businessLicense: c.businessLicense, contact: c.contact } : null,
        product: p ? { id: p.id, code: p.code, name: p.name, pricingType: p.pricingType } : null
      };
    });

    const total = orders.length;
    const start = (page - 1) * limit;
    orders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.approveOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = db.orders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.reviewStatus !== 'pending') {
      return res.status(400).json({ message: '订单已审核' });
    }

    db.orders.update(parseInt(id), {
      reviewStatus: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.admin.id,
      paymentStatus: 'paid',
      paidAt: new Date()
    });

    const existingKeys = db.apiKeys.findByCustomerId(order.customerId);
    const existingForProduct = existingKeys.find(k => k.productId === order.productId);
    let apiKey = existingForProduct ? existingForProduct.apiKey : null;

    if (!apiKey) {
      apiKey = 'ak_' + Date.now() + Math.random().toString(36).substr(2, 24);
      db.apiKeys.create({
        customerId: order.customerId,
        productId: order.productId,
        apiKey: apiKey,
        status: 'active'
      });
    }

    if (order.orderType === 'per_call') {
      const customer = db.customers.findById(order.customerId);
      db.customers.update(order.customerId, { quota: (customer.quota || 0) + order.quantity });
    }

    const updatedOrder = db.orders.findById(parseInt(id));
    res.status(200).json({ message: '订单审核通过', order: updatedOrder, apiKey });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.rejectOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const order = db.orders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.reviewStatus !== 'pending') {
      return res.status(400).json({ message: '订单已审核' });
    }

    db.orders.update(parseInt(id), {
      reviewStatus: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.admin.id,
      rejectReason: reason || '审核未通过'
    });

    const updatedOrder = db.orders.findById(parseInt(id));
    res.status(200).json({ message: '订单审核拒绝', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};