const db = require('../config/database');

exports.generateBill = async (req, res) => {
  const { customerId, period } = req.body;

  try {
    const customer = db.customers.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    const existingBill = db.customerBills.findByCustomerIdAndPeriod(customerId, period);
    if (existingBill) {
      return res.status(400).json({ message: '该周期账单已存在', bill: existingBill });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const logs = db.apiLogs.findAll().filter(l => {
      if (l.customerId !== customerId) return false;
      const callTime = new Date(l.createdAt || l.callTime);
      return callTime >= startDate && callTime <= endDate;
    });

    let totalAmount = 0;
    let prepayAmount = 0;
    let postpayAmount = 0;

    const accountStats = {};

    for (const log of logs) {
      if (!log.success) continue;
      const product = db.products.findById(log.productId);
      if (!product) continue;

      const accountId = log.accountId || 'unknown';
      const paymentType = log.paymentType || 'postpay';

      if (!accountStats[accountId]) {
        accountStats[accountId] = {
          accountId,
          accountName: accountId === 'unknown' ? '未知' : (db.accounts.findById(accountId)?.name || '账号' + accountId),
          prepay: {},
          postpay: {},
          prepayTotal: 0,
          postpayTotal: 0
        };
      }

      const stats = accountStats[accountId];
      const paymentStats = paymentType === 'prepay' ? stats.prepay : stats.postpay;
      const paymentTotal = paymentType === 'prepay' ? 'prepayTotal' : 'postpayTotal';

      if (!paymentStats[product.id]) {
        paymentStats[product.id] = {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          callCount: 0,
          pricePerCall: product.pricePerCall,
          amount: 0
        };
      }

      const price = product.pricingType === 'per_call' ? product.pricePerCall : product.subscriptionPrice;
      paymentStats[product.id].callCount++;
      paymentStats[product.id].amount += price;
      stats[paymentTotal] += price;

      if (paymentType === 'prepay') {
        prepayAmount += price;
      } else {
        postpayAmount += price;
      }
      totalAmount += price;
    }

    const bill = db.customerBills.create({
      customerId,
      period,
      totalAmount,
      prepayAmount,
      postpayAmount,
      status: 'pending',
      generatedAt: new Date().toISOString()
    });

    for (const accountId in accountStats) {
      const stats = accountStats[accountId];

      for (const productId in stats.prepay) {
        const pStats = stats.prepay[productId];
        db.customerBillItems.create({
          billId: bill.id,
          accountId: stats.accountId,
          accountName: stats.accountName,
          productId: pStats.productId,
          productName: pStats.productName,
          productCode: pStats.productCode,
          paymentType: 'prepay',
          callCount: pStats.callCount,
          pricePerCall: pStats.pricePerCall,
          amount: pStats.amount
        });
      }

      for (const productId in stats.postpay) {
        const pStats = stats.postpay[productId];
        db.customerBillItems.create({
          billId: bill.id,
          accountId: stats.accountId,
          accountName: stats.accountName,
          productId: pStats.productId,
          productName: pStats.productName,
          productCode: pStats.productCode,
          paymentType: 'postpay',
          callCount: pStats.callCount,
          pricePerCall: pStats.pricePerCall,
          amount: pStats.amount
        });
      }
    }

    res.status(201).json({ message: '账单生成成功', bill });

  } catch (error) {
    console.error('generateBill error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getBills = async (req, res) => {
  const { customerId } = req.query;
  const { page = 1, limit = 20 } = req.query;

  try {
    let bills;
    if (customerId) {
      bills = db.customerBills.findByCustomerId(parseInt(customerId));
    } else {
      bills = db.customerBills.findAll();
    }

    bills = bills.map(b => {
      const customer = db.customers.findById(b.customerId);
      return {
        ...b,
        customerName: customer ? customer.companyName || customer.name : '-'
      };
    });

    bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = bills.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBills = bills.slice(start, start + parseInt(limit));

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), bills: paginatedBills });

  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getBillDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const bill = db.customerBills.findById(parseInt(id));
    if (!bill) {
      return res.status(404).json({ message: '账单不存在' });
    }

    const customer = db.customers.findById(bill.customerId);
    const items = db.customerBillItems.findByBillId(bill.id);

    const accountSummary = {};
    for (const item of items) {
      const aid = item.accountId || 'unknown';
      if (!accountSummary[aid]) {
        accountSummary[aid] = {
          accountId: aid,
          accountName: item.accountName || '未知账号',
          prepayTotal: 0,
          postpayTotal: 0,
          items: []
        };
      }
      if (item.paymentType === 'prepay') {
        accountSummary[aid].prepayTotal += item.amount;
      } else {
        accountSummary[aid].postpayTotal += item.amount;
      }
      accountSummary[aid].items.push(item);
    }

    res.status(200).json({
      bill: {
        ...bill,
        customerName: customer ? customer.companyName || customer.name : '-'
      },
      items,
      accountSummary: Object.values(accountSummary)
    });

  } catch (error) {
    console.error('getBillDetail error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.confirmBill = async (req, res) => {
  const { id } = req.params;

  try {
    const bill = db.customerBills.findById(parseInt(id));
    if (!bill) {
      return res.status(404).json({ message: '账单不存在' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).json({ message: '账单状态不可确认' });
    }

    db.customerBills.update(id, { status: 'confirmed', confirmedAt: new Date().toISOString() });

    res.status(200).json({ message: '账单已确认' });

  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.autoGenerateMonthlyBills = async (req, res) => {
  const { period } = req.body;

  try {
    const customers = db.customers.findAll();
    const results = [];

    for (const customer of customers) {
      const existingBill = db.customerBills.findByCustomerIdAndPeriod(customer.id, period);
      if (existingBill) {
        results.push({ customerId: customer.id, status: 'skipped', reason: '账单已存在' });
        continue;
      }

      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      const logs = db.apiLogs.findAll().filter(l => {
        if (l.customerId !== customer.id) return false;
        const callTime = new Date(l.createdAt || l.callTime);
        return callTime >= startDate && callTime <= endDate;
      });

      if (logs.length === 0) {
        results.push({ customerId: customer.id, status: 'skipped', reason: '无调用记录' });
        continue;
      }

      let totalAmount = 0;
      let prepayAmount = 0;
      let postpayAmount = 0;

      for (const log of logs) {
        if (!log.success) continue;
        const product = db.products.findById(log.productId);
        if (product && product.pricingType === 'per_call') {
          const price = product.pricePerCall;
          totalAmount += price;

          const paymentType = log.paymentType || 'postpay';
          if (paymentType === 'prepay') {
            prepayAmount += price;
          } else {
            postpayAmount += price;
          }
        }
      }

      if (totalAmount === 0) {
        results.push({ customerId: customer.id, status: 'skipped', reason: '无消费' });
        continue;
      }

      const bill = db.customerBills.create({
        customerId: customer.id,
        period,
        totalAmount,
        prepayAmount,
        postpayAmount,
        status: 'pending',
        generatedAt: new Date().toISOString()
      });

      results.push({ customerId: customer.id, billId: bill.id, status: 'created' });
    }

    res.status(200).json({ message: '批量生成完成', results });

  } catch (error) {
    console.error('autoGenerateMonthlyBills error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};