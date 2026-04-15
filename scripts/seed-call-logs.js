const db = require('../src/config/database');

console.log('开始生成模拟数据...');

const channels = db.channels.findAll();
const suppliers = db.suppliers.findAll();

console.log(`找到 ${channels.length} 个通道，${suppliers.length} 个供应商`);

if (channels.length === 0) {
  console.log('没有通道数据，请先添加通道');
  process.exit(1);
}

const responseCodes = ['00', '01', '02', '03'];
const responseMessages = {
  '00': '成功',
  '01': '认证失败',
  '02': '系统繁忙',
  '03': '参数错误'
};
const costRules = ['per_call', 'per_key', 'tiered'];

let callLogCount = 0;
const now = new Date();

for (let i = 0; i < 50; i++) {
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const supplier = suppliers.find(s => s.id === channel.supplierId);

  const daysAgo = Math.floor(Math.random() * 30);
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);

  const callTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000);

  const costRule = channel.costRule || { rule_type: 'per_call', rule_config: { price: 0.5 } };
  let cost = 0;

  if (costRule.rule_type === 'per_call') {
    cost = costRule.rule_config.price || 0.5;
  } else if (costRule.rule_type === 'tiered') {
    const tiers = costRule.rule_config.tiers || [];
    if (tiers.length > 0) {
      cost = tiers[0].price || 0.5;
    }
  } else if (costRule.rule_type === 'per_key') {
    cost = costRule.rule_config.per_time || 0.3;
  }

  const responseCode = responseCodes[Math.floor(Math.random() * responseCodes.length)];
  const responseMessage = responseMessages[responseCode];
  const success = responseCode === '00';

  const requestParams = {
    phone: `138****${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    name: '测试用户',
    idCard: `${Math.floor(Math.random() * 900000 + 100000)}*************`
  };

  const responseParams = {
    resultCode: responseCode,
    message: success ? '认证成功' : '认证失败',
    verifyId: `V${Date.now()}${Math.floor(Math.random() * 1000)}`
  };

  db.callLogs.create({
    channelId: channel.id,
    supplierId: channel.supplierId,
    customerId: 1,
    productId: 1,
    callTime: callTime.toISOString(),
    requestParams,
    responseParams,
    responseCode,
    responseMessage,
    responseTime: Math.floor(Math.random() * 500 + 50),
    cost,
    success
  });

  callLogCount++;
}

console.log(`成功生成 ${callLogCount} 条调用日志`);

console.log('\n生成测试账单...');

const supplier = suppliers[0];
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

const billNo = `BILL${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

const existingBill = db.supplierBills.findByPeriod(
  supplier.id,
  lastMonth.toISOString().slice(0, 10),
  lastMonthEnd.toISOString().slice(0, 10)
);

if (existingBill) {
  console.log('上月账单已存在，跳过生成');
} else {
  const logs = db.callLogs.findAll().filter(log => {
    const callTime = new Date(log.callTime);
    return log.supplierId === supplier.id &&
      callTime >= lastMonth &&
      callTime <= lastMonthEnd;
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

  const bill = db.supplierBills.create({
    supplierId: supplier.id,
    billNo,
    periodStart: lastMonth.toISOString().slice(0, 10),
    periodEnd: lastMonthEnd.toISOString().slice(0, 10),
    settlementType: 'monthly',
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

  console.log(`账单 ${billNo} 生成成功，总金额: ¥${totalAmount.toFixed(2)}，包含 ${billItems.length} 个通道`);
}

console.log('\n模拟数据生成完成！');
process.exit(0);