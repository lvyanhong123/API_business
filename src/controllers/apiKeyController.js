const db = require('../config/database');

exports.getKeys = async (req, res) => {
  const { customerId, productId } = req.query;

  try {
    let keys = db.apiKeys.findAll();

    if (customerId) {
      keys = keys.filter(k => k.customerId === parseInt(customerId));
    }
    if (productId) {
      keys = keys.filter(k => k.productId === parseInt(productId));
    }

    keys = keys.map(k => {
      const customer = db.customers.findById(k.customerId);
      const product = db.products.findById(k.productId);
      return {
        ...k,
        customerName: customer ? customer.companyName || customer.name : '-',
        productName: product ? product.name : '-'
      };
    });

    res.status(200).json({ keys });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getCustomerKeys = async (req, res) => {
  const customerId = req.customer.id;

  try {
    const keys = db.apiKeys.findByCustomerId(customerId);
    const enrichedKeys = keys.map(k => {
      const product = db.products.findById(k.productId);
      return {
        ...k,
        productName: product ? product.name : '-',
        productCode: product ? product.code : '-'
      };
    });

    res.status(200).json({ keys: enrichedKeys });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.revokeKey = async (req, res) => {
  const { id } = req.params;

  try {
    const key = db.apiKeys.findById(parseInt(id));
    if (!key) {
      return res.status(404).json({ message: 'API Key不存在' });
    }

    db.apiKeys.update(parseInt(id), { status: 'revoked' });

    res.status(200).json({ message: 'Key已吊销' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};