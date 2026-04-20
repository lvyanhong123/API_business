const db = require('../config/database');

exports.getMyQuotas = async (req, res) => {
  try {
    const accountId = req.account.id;

    const quotas = db.accountProductQuotas.findByAccountId(accountId);

    const enrichedQuotas = quotas.map(q => {
      const product = db.products.findById(q.productId);
      const orders = db.orders.findAll().filter(o =>
        o.accountId === accountId &&
        o.productId === q.productId &&
        o.reviewStatus === 'approved' &&
        o.orderType === 'per_call'
      );

      const prepayOrders = orders.filter(o => o.paymentType === 'prepay');
      const postpayOrders = orders.filter(o => o.paymentType === 'postpay');

      const totalPrepay = prepayOrders.reduce((sum, o) => sum + o.quantity, 0);
      const totalPostpay = postpayOrders.reduce((sum, o) => sum + o.quantity, 0);

      const autoRenewal = db.autoRenewalConfigs.findOne({
        accountId,
        productId: q.productId,
        enabled: true
      });

      return {
        id: q.id,
        productId: q.productId,
        productName: product?.name || '-',
        productCode: product?.code || '-',
        prepayQuota: {
          total: totalPrepay,
          remaining: q.prepayRemaining,
          used: totalPrepay - q.prepayRemaining
        },
        postpayQuota: {
          total: totalPostpay,
          consumed: q.postpayConsumed,
          remaining: totalPostpay - q.postpayConsumed
        },
        autoRenewal: autoRenewal ? {
          id: autoRenewal.id,
          triggerType: autoRenewal.triggerType,
          triggerValue: autoRenewal.triggerValue,
          renewQuantity: autoRenewal.renewQuantity
        } : null,
        lastOrderTime: orders.length > 0 ? orders[orders.length - 1].createdAt : null
      };
    });

    res.status(200).json({ quotas: enrichedQuotas });
  } catch (error) {
    console.error('getMyQuotas error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.saveAutoRenewal = async (req, res) => {
  const { productId, triggerType, triggerValue, renewQuantity } = req.body;

  if (!productId || !triggerType || !triggerValue || !renewQuantity) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  if (!['ratio', 'count'].includes(triggerType)) {
    return res.status(400).json({ message: '触发类型只能是 ratio 或 count' });
  }

  if (triggerType === 'ratio' && (triggerValue <= 0 || triggerValue > 100)) {
    return res.status(400).json({ message: '触发比例必须在 1-100 之间' });
  }

  if (triggerType === 'count' && triggerValue <= 0) {
    return res.status(400).json({ message: '触发次数必须大于 0' });
  }

  try {
    const accountId = req.account.id;

    const quota = db.accountProductQuotas.findOne({ accountId, productId });
    if (!quota) {
      return res.status(404).json({ message: '您还没有购买该产品' });
    }

    const existing = db.autoRenewalConfigs.findOne({ accountId, productId });
    if (existing) {
      db.autoRenewalConfigs.update(existing.id, {
        triggerType,
        triggerValue,
        renewQuantity,
        enabled: true
      });
      res.status(200).json({ message: '自动续订已更新', config: { id: existing.id, triggerType, triggerValue, renewQuantity } });
    } else {
      const config = db.autoRenewalConfigs.create({
        accountId,
        productId,
        customerId: quota.customerId,
        triggerType,
        triggerValue,
        renewQuantity,
        enabled: true
      });
      res.status(200).json({ message: '自动续订已开启', config });
    }
  } catch (error) {
    console.error('saveAutoRenewal error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.disableAutoRenewal = async (req, res) => {
  const { productId } = req.params;

  try {
    const accountId = req.account.id;

    const existing = db.autoRenewalConfigs.findOne({ accountId, productId: parseInt(productId) });
    if (existing) {
      db.autoRenewalConfigs.update(existing.id, { enabled: false });
    }

    res.status(200).json({ message: '自动续订已关闭' });
  } catch (error) {
    console.error('disableAutoRenewal error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};