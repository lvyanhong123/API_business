const db = require('../config/database');
const { calculateCost } = require('../services/costCalculator');

exports.getBills = async (req, res) => {
  const { supplierId, status, page = 1, limit = 20 } = req.query;

  try {
    let bills = db.supplierBills.findAll();

    if (supplierId) {
      bills = bills.filter(b => b.supplierId === parseInt(supplierId));
    }
    if (status) {
      bills = bills.filter(b => b.status === status);
    }

    bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = bills.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBills = bills.slice(start, start + parseInt(limit));

    const enrichedBills = paginatedBills.map(bill => {
      const supplier = db.suppliers.findById(bill.supplierId);
      const items = db.billItems.findByBillId(bill.id);
      return {
        ...bill,
        supplierName: supplier ? supplier.name : '-',
        itemCount: items.length
      };
    });

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      bills: enrichedBills
    });
  } catch (error) {
    console.error('Error getting bills:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getBill = async (req, res) => {
  const { id } = req.params;

  try {
    const bill = db.supplierBills.findById(parseInt(id));
    if (!bill) {
      return res.status(404).json({ message: '账单不存在' });
    }

    const supplier = db.suppliers.findById(bill.supplierId);
    const items = db.billItems.findByBillId(bill.id);

    const enrichedItems = items.map(item => {
      const channel = db.channels.findById(item.channelId);
      return {
        ...item,
        channelName: channel ? channel.name : '-'
      };
    });

    res.status(200).json({
      ...bill,
      supplier,
      items: enrichedItems
    });
  } catch (error) {
    console.error('Error getting bill:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.generateBill = async (req, res) => {
  const { supplierId, periodStart, periodEnd, settlementType } = req.body;

  try {
    const supplier = db.suppliers.findById(parseInt(supplierId));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    const existingBill = db.supplierBills.findByPeriod(
      parseInt(supplierId),
      periodStart,
      periodEnd
    );
    if (existingBill) {
      return res.status(400).json({ message: '该周期账单已存在' });
    }

    const logs = db.callLogs.findAll().filter(log => {
      const callTime = new Date(log.callTime);
      return log.supplierId === parseInt(supplierId) &&
        callTime >= new Date(periodStart) &&
        callTime <= new Date(periodEnd);
    });

    const channelMap = {};
    logs.forEach(log => {
      if (!channelMap[log.channelId]) {
        channelMap[log.channelId] = {
          channelId: log.channelId,
          supplierId: log.supplierId,
          callCount: 0,
          totalCost: 0,
          successCount: 0,
          failedCount: 0
        };
      }
      channelMap[log.channelId].callCount++;
      if (log.success) {
        channelMap[log.channelId].successCount++;
      } else {
        channelMap[log.channelId].failedCount++;
      }
      channelMap[log.channelId].totalCost += log.cost || 0;
    });

    const billNo = `BILL${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`;

    const bill = db.supplierBills.create({
      supplierId: parseInt(supplierId),
      billNo,
      periodStart,
      periodEnd,
      settlementType: settlementType || 'monthly',
      totalAmount: 0,
      status: 'generated',
      generatedAt: new Date().toISOString()
    });

    const billItems = [];
    let totalAmount = 0;

    Object.values(channelMap).forEach(channelData => {
      const channel = db.channels.findById(channelData.channelId);
      const item = {
        billId: bill.id,
        channelId: channelData.channelId,
        callCount: channelData.callCount,
        successCount: channelData.successCount,
        failedCount: channelData.failedCount,
        costRule: channel?.costRule || {},
        amount: channelData.totalCost
      };
      billItems.push(item);
      totalAmount += channelData.totalCost;
    });

    if (billItems.length > 0) {
      db.billItems.createMany(billItems);
    }

    db.supplierBills.update(bill.id, { totalAmount });

    res.status(201).json({
      message: '账单生成成功',
      bill: { ...bill, totalAmount },
      itemCount: billItems.length
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getSupplierSettlement = async (req, res) => {
  const { supplierId } = req.params;

  try {
    const supplier = db.suppliers.findById(parseInt(supplierId));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    const channels = db.channels.findBySupplier(parseInt(supplierId));

    const channelSummaries = channels.map(channel => {
      const logs = db.callLogs.findByChannel(channel.id);
      const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
      return {
        channelId: channel.id,
        channelName: channel.name,
        callCount: logs.length,
        totalCost
      };
    });

    const overallTotal = channelSummaries.reduce((sum, c) => sum + c.totalCost, 0);

    res.status(200).json({
      supplier,
      channels: channelSummaries,
      totalCallCount: channelSummaries.reduce((sum, c) => sum + c.callCount, 0),
      totalCost: overallTotal
    });
  } catch (error) {
    console.error('Error getting supplier settlement:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};