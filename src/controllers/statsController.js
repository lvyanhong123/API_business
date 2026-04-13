const db = require('../config/database');

exports.getOverview = async (req, res) => {
  try {
    const totalCustomers = db.customers.count();
    const totalProducts = db.products.count({ status: 'online' });
    const totalOrders = db.orders.count();

    const paidOrders = db.orders.findAll().filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCalls = db.apiLogs.count();

    res.status(200).json({ totalCustomers, totalProducts, totalOrders, totalRevenue, todayCalls });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const products = db.products.findAll();
    const stats = products.map(p => {
      const logs = db.apiLogs.findAll().filter(l => l.productId === p.id);
      const successfulCalls = logs.filter(l => l.success).length;
      return {
        productCode: p.code,
        productName: p.name,
        totalCalls: logs.length,
        successfulCalls,
        totalRevenue: logs.reduce((sum, l) => sum + l.fee, 0)
      };
    });

    stats.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const customers = db.customers.findAll();
    const stats = customers.map(c => {
      const logs = db.apiLogs.findAll().filter(l => l.customerId === c.id);
      return {
        companyName: c.companyName,
        totalCalls: logs.length,
        totalSpent: logs.reduce((sum, l) => sum + l.fee, 0)
      };
    });

    stats.sort((a, b) => b.totalCalls - a.totalCalls);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getCustomerUsage = async (req, res) => {
  const { startDate, endDate, page = 1, limit = 50 } = req.query;

  try {
    let logs = db.apiLogs.findAll().filter(l => l.customerId === req.customer.id);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      logs = logs.filter(l => {
        const created = new Date(l.createdAt);
        return created >= start && created <= end;
      });
    }

    const totalCalls = logs.length;
    const successfulCalls = logs.filter(l => l.success).length;
    const totalSpent = logs.reduce((sum, l) => sum + l.fee, 0);

    const total = logs.length;
    const start = (page - 1) * limit;
    logs = logs.slice(start, start + parseInt(limit));

    logs = logs.map(l => {
      const p = db.products.findById(l.productId);
      return { ...l, product: p ? { code: p.code, name: p.name } : null };
    });

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      logs,
      summary: { totalCalls, successfulCalls, totalSpent }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getCustomerBills = async (req, res) => {
  try {
    const orders = db.orders.findAll().filter(o => o.customerId === req.customer.id && o.paymentStatus === 'paid');

    const monthlyBills = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toISOString().substring(0, 7);
      if (!monthlyBills[month]) {
        monthlyBills[month] = { month, totalAmount: 0, orders: [] };
      }
      const p = db.products.findById(order.productId);
      monthlyBills[month].totalAmount += order.amount;
      monthlyBills[month].orders.push({
        orderNo: order.orderNo,
        productName: p ? p.name : '',
        amount: order.amount,
        createdAt: order.createdAt
      });
    });

    res.status(200).json(Object.values(monthlyBills));
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};