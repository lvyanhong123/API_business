const db = require('../config/database');

function ensureAccount(customerId) {
  let account = db.customerAccounts.findByCustomerId(parseInt(customerId));
  if (!account) {
    account = db.customerAccounts.create({
      customerId: parseInt(customerId),
      balance: 0,
      creditLimit: 0
    });
  }
  return account;
}

exports.getAccount = async (req, res) => {
  const { customerId } = req.params;

  try {
    const customer = db.customers.findById(parseInt(customerId));
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    const account = ensureAccount(customerId);
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getTransactionRecords = async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const records = [];
    const customerIdInt = parseInt(customerId);

    const payments = db.paymentOrders.findAll().filter(p => p.customerId === customerIdInt);
    payments.forEach(p => {
      records.push({
        id: p.id,
        type: p.targetAccount === 'credit' ? '信用恢复' : '余额充值',
        account: p.targetAccount,
        amount: p.amount,
        direction: '+',
        createdAt: p.createdAt,
        source: 'payment'
      });
    });

    const withdraws = db.withdrawOrders.findAll().filter(w => w.customerId === customerIdInt);
    withdraws.forEach(w => {
      records.push({
        id: w.id,
        type: '余额提现',
        account: 'balance',
        amount: w.amount,
        direction: '-',
        createdAt: w.createdAt,
        source: 'withdraw'
      });
    });

    const refunds = db.refundOrders.findAll().filter(r => r.customerId === customerIdInt);
    refunds.forEach(r => {
      records.push({
        id: r.id,
        type: '消费退款',
        account: r.targetAccount,
        amount: r.amount,
        direction: '+',
        createdAt: r.createdAt,
        source: 'refund'
      });
    });

    const orders = db.orders.findAll().filter(o => o.customerId === customerIdInt);
    orders.forEach(o => {
      if (o.reviewStatus === 'approved' && o.paymentStatus === 'paid') {
        records.push({
          id: o.id,
          orderNo: o.orderNo,
          type: '订单消费',
          account: o.paymentMethod,
          amount: o.amount,
          direction: '-',
          createdAt: o.createdAt,
          source: 'order'
        });
      }
    });

    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = records.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRecords = records.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), records: paginatedRecords });
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
  const { amount, orderId, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: '请输入正确的金额' });
  }

  const payMethod = paymentMethod || 'balance';

  try {
    const account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    if (payMethod === 'balance') {
      if (account.balance < amount) {
        return res.status(400).json({ message: '余额不足' });
      }
      const newBalance = account.balance - amount;
      db.customerAccounts.update(account.id, { balance: newBalance });
      return res.status(200).json({ message: '扣款成功', balance: newBalance, creditLimit: account.creditLimit });
    } else if (payMethod === 'credit') {
      if (account.creditLimit < amount) {
        return res.status(400).json({ message: '信用额度不足' });
      }
      const newCreditLimit = account.creditLimit - amount;
      db.customerAccounts.update(account.id, { creditLimit: newCreditLimit });
      return res.status(200).json({ message: '扣款成功', balance: account.balance, creditLimit: newCreditLimit });
    } else {
      return res.status(400).json({ message: '无效的支付方式' });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.addBalance = async (req, res) => {
  const { customerId } = req.params;
  const { amount, paymentMethod, targetAccount, remark } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: '请输入正确的金额' });
  }

  const target = targetAccount || 'balance';

  try {
    const customer = db.customers.findById(parseInt(customerId));
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    const account = ensureAccount(customerId);

    let newBalance = account.balance;
    let newCreditLimit = account.creditLimit;

    if (target === 'balance') {
      newBalance = account.balance + amount;
    } else if (target === 'credit') {
      newCreditLimit = account.creditLimit + amount;
    } else {
      return res.status(400).json({ message: '无效的目标账户' });
    }

    db.customerAccounts.update(account.id, { balance: newBalance, creditLimit: newCreditLimit });

    db.paymentOrders.create({
      customerId: parseInt(customerId),
      amount,
      paymentMethod: paymentMethod || 'bank',
      targetAccount: target,
      status: 'confirmed',
      remark: remark || '',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ message: '充值成功', balance: newBalance, creditLimit: newCreditLimit });
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

exports.updatePaymentOrder = async (req, res) => {
  const { id } = req.params;
  const { amount, targetAccount, paymentMethod, remark } = req.body;

  try {
    const order = db.paymentOrders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '收款单不存在' });
    }

    const oldTargetAccount = order.targetAccount;
    const newTargetAccount = targetAccount || oldTargetAccount;
    const amountChange = amount ? amount - order.amount : 0;

    const account = db.customerAccounts.findByCustomerId(order.customerId);
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    if (amountChange !== 0) {
      if (oldTargetAccount === 'balance' && newTargetAccount === 'balance') {
        db.customerAccounts.update(account.id, { balance: account.balance + amountChange });
      } else if (oldTargetAccount === 'credit' && newTargetAccount === 'credit') {
        db.customerAccounts.update(account.id, { creditLimit: account.creditLimit + amountChange });
      } else if (oldTargetAccount === 'balance' && newTargetAccount === 'credit') {
        db.customerAccounts.update(account.id, { balance: account.balance - order.amount, creditLimit: account.creditLimit + amount });
      } else if (oldTargetAccount === 'credit' && newTargetAccount === 'balance') {
        db.customerAccounts.update(account.id, { creditLimit: account.creditLimit - order.amount, balance: account.balance + amount });
      }
    }

    db.paymentOrders.update(parseInt(id), {
      amount: amount !== undefined ? amount : order.amount,
      targetAccount: targetAccount || order.targetAccount,
      paymentMethod: paymentMethod || order.paymentMethod,
      remark: remark !== undefined ? remark : order.remark
    });

    res.status(200).json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deletePaymentOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = db.paymentOrders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '收款单不存在' });
    }

    const account = db.customerAccounts.findByCustomerId(order.customerId);
    if (account) {
      if (order.targetAccount === 'balance') {
        db.customerAccounts.update(account.id, { balance: account.balance - order.amount });
      } else if (order.targetAccount === 'credit') {
        db.customerAccounts.update(account.id, { creditLimit: account.creditLimit - order.amount });
      }
    }

    db.paymentOrders.delete(parseInt(id));
    res.status(200).json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateWithdrawOrder = async (req, res) => {
  const { id } = req.params;
  const { amount, remark } = req.body;

  try {
    const order = db.withdrawOrders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '打款单不存在' });
    }

    const amountChange = amount ? amount - order.amount : 0;

    const account = db.customerAccounts.findByCustomerId(order.customerId);
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    if (amountChange !== 0) {
      const newBalance = account.balance + amountChange;
      if (newBalance < 0) {
        return res.status(400).json({ message: '余额不足' });
      }
      db.customerAccounts.update(account.id, { balance: newBalance });
    }

    db.withdrawOrders.update(parseInt(id), {
      amount: amount !== undefined ? amount : order.amount,
      remark: remark !== undefined ? remark : order.remark
    });

    res.status(200).json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deleteWithdrawOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = db.withdrawOrders.findById(parseInt(id));
    if (!order) {
      return res.status(404).json({ message: '打款单不存在' });
    }

    const account = db.customerAccounts.findByCustomerId(order.customerId);
    if (account) {
      db.customerAccounts.update(account.id, { balance: account.balance + order.amount });
    }

    db.withdrawOrders.delete(parseInt(id));
    res.status(200).json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.refund = async (req, res) => {
  const { customerId } = req.params;
  const { amount, reason, targetAccount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: '请输入正确的金额' });
  }

  const target = targetAccount || 'balance';

  try {
    const account = db.customerAccounts.findByCustomerId(parseInt(customerId));
    if (!account) {
      return res.status(404).json({ message: '账户不存在' });
    }

    let newBalance = account.balance;
    let newCreditLimit = account.creditLimit;

    if (target === 'balance') {
      newBalance = account.balance + amount;
    } else if (target === 'credit') {
      newCreditLimit = account.creditLimit + amount;
    } else {
      return res.status(400).json({ message: '无效的目标账户' });
    }

    db.customerAccounts.update(account.id, { balance: newBalance, creditLimit: newCreditLimit });

    db.refundOrders.create({
      customerId: parseInt(customerId),
      amount,
      reason: reason || '',
      targetAccount: target,
      status: 'completed',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ message: '退款成功', balance: newBalance, creditLimit: newCreditLimit });
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

exports.withdraw = async (req, res) => {
  const { customerId } = req.params;
  const { amount, remark } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: '请输入正确的金额' });
  }

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

    db.withdrawOrders.create({
      customerId: parseInt(customerId),
      amount,
      remark: remark || '',
      status: 'completed',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ message: '提现成功', balance: newBalance, creditLimit: account.creditLimit });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getWithdrawOrders = async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    let orders = db.withdrawOrders.findAll().filter(o => o.customerId === parseInt(customerId));
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
        customerName: c.companyName || c.name,
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

exports.getAllPaymentOrders = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const customers = db.customers.findAll();
    const customerMap = {};
    customers.forEach(c => { customerMap[c.id] = c.companyName || c.name; });

    let orders = db.paymentOrders.findAll().map(o => ({
      ...o,
      customerName: customerMap[o.customerId] || '-'
    }));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders: paginatedOrders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getAllWithdrawOrders = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const customers = db.customers.findAll();
    const customerMap = {};
    customers.forEach(c => { customerMap[c.id] = c.companyName || c.name; });

    let orders = db.withdrawOrders.findAll().map(o => ({
      ...o,
      customerName: customerMap[o.customerId] || '-'
    }));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = orders.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), orders: paginatedOrders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};