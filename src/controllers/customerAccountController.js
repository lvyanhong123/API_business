const db = require('../config/database');

exports.getAccount = async (req, res) => {
  const { customerId } = req.params;

  try {
    const customer = db.customers.findById(parseInt(customerId));
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    let account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      account = db.customerAccounts.create({
        customerId: parseInt(customerId),
        balance: 0,
        creditLimit: 0
      });
    }

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateAccount = async (req, res) => {
  const { customerId } = req.params;
  const { balance, creditLimit } = req.body;

  try {
    let account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      account = db.customerAccounts.create({
        customerId: parseInt(customerId),
        balance: balance || 0,
        creditLimit: creditLimit || 0
      });
    } else {
      const updateData = {};
      if (balance !== undefined) updateData.balance = balance;
      if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
      account = db.customerAccounts.update(account.id, updateData);
    }

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deductBalance = async (req, res) => {
  const { customerId } = req.params;
  const { amount, orderId } = req.body;

  try {
    const account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: '余额不足' });
    }

    const newBalance = account.balance - amount;
    db.customerAccounts.update(account.id, { balance: newBalance });

    res.status(200).json({ message: '扣款成功', balance: newBalance });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.addBalance = async (req, res) => {
  const { customerId } = req.params;
  const { amount, paymentMethod, remark } = req.body;

  try {
    const customer = db.customers.findById(parseInt(customerId));
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    let account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      account = db.customerAccounts.create({
        customerId: parseInt(customerId),
        balance: 0,
        creditLimit: 0
      });
    }

    const newBalance = account.balance + amount;
    db.customerAccounts.update(account.id, { balance: newBalance });

    db.paymentOrders.create({
      customerId: parseInt(customerId),
      amount,
      paymentMethod: paymentMethod || 'bank',
      status: 'confirmed',
      remark: remark || '',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ message: '充值成功', balance: newBalance });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getPaymentOrders = async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    let orders = db.paymentOrders.findAll().filter(o => o.customerId === parseInt(customerId));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders: paginatedOrders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.refund = async (req, res) => {
  const { customerId } = req.params;
  const { amount, reason } = req.body;

  try {
    const account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: '可退款余额不足' });
    }

    const newBalance = account.balance - amount;
    db.customerAccounts.update(account.id, { balance: newBalance });

    db.refundOrders.create({
      customerId: parseInt(customerId),
      amount,
      reason: reason || '',
      status: 'completed',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ message: '退款成功', balance: newBalance });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getRefundOrders = async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    let orders = db.refundOrders.findAll().filter(o => o.customerId === parseInt(customerId));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders: paginatedOrders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getAllAccounts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const customers = db.customers.findAll();
    const accounts = customers.map(c => {
      let account = db.customerAccounts.findByCustomerId(c.id);
      if (!account) {
        account = db.customerAccounts.create({
          customerId: c.id,
          balance: 0,
          creditLimit: 0
        });
      }
      return {
        ...account,
        customerName: c.name,
        customerCode: c.code
      };
    });

    accounts.sort((a, b) => b.balance - a.balance);

    const total = accounts.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedAccounts = accounts.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), accounts: paginatedAccounts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};