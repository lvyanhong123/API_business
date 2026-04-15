const db = require('../config/database');

exports.getCallLogs = async (req, res) => {
  const { channelId, supplierId, startTime, endTime, page = 1, limit = 50 } = req.query;

  try {
    let logs = db.callLogs.findAll();

    if (channelId) {
      logs = logs.filter(l => l.channelId === parseInt(channelId));
    }
    if (supplierId) {
      logs = logs.filter(l => l.supplierId === parseInt(supplierId));
    }
    if (startTime) {
      logs = logs.filter(l => new Date(l.callTime) >= new Date(startTime));
    }
    if (endTime) {
      logs = logs.filter(l => new Date(l.callTime) <= new Date(endTime));
    }

    logs.sort((a, b) => new Date(b.callTime) - new Date(a.callTime));

    const total = logs.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLogs = logs.slice(start, start + parseInt(limit));

    const enrichedLogs = paginatedLogs.map(log => {
      const channel = db.channels.findById(log.channelId);
      const supplier = db.suppliers.findById(log.supplierId);
      return {
        ...log,
        channelName: channel ? channel.name : '-',
        supplierName: supplier ? supplier.name : '-'
      };
    });

    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCost,
      logs: enrichedLogs
    });
  } catch (error) {
    console.error('Error getting call logs:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getCallLogStats = async (req, res) => {
  const { supplierId, startTime, endTime } = req.query;

  try {
    let logs = db.callLogs.findAll();

    if (supplierId) {
      logs = logs.filter(l => l.supplierId === parseInt(supplierId));
    }
    if (startTime) {
      logs = logs.filter(l => new Date(l.callTime) >= new Date(startTime));
    }
    if (endTime) {
      logs = logs.filter(l => new Date(l.callTime) <= new Date(endTime));
    }

    const totalCalls = logs.length;
    const successfulCalls = logs.filter(l => l.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const avgResponseTime = totalCalls > 0 ? logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalCalls : 0;

    const byChannel = {};
    logs.forEach(log => {
      if (!byChannel[log.channelId]) {
        byChannel[log.channelId] = { channelId: log.channelId, callCount: 0, successCount: 0, totalCost: 0 };
      }
      byChannel[log.channelId].callCount++;
      if (log.success) byChannel[log.channelId].successCount++;
      byChannel[log.channelId].totalCost += log.cost || 0;
    });

    res.status(200).json({
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      avgResponseTime: Math.round(avgResponseTime),
      byChannel: Object.values(byChannel)
    });
  } catch (error) {
    console.error('Error getting call log stats:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getChannelCallLogs = async (req, res) => {
  const { channelId } = req.params;
  const { startTime, endTime, page = 1, limit = 50 } = req.query;

  try {
    const channel = db.channels.findById(parseInt(channelId));
    if (!channel) {
      return res.status(404).json({ message: '通道不存在' });
    }

    let logs = db.callLogs.findByChannel(parseInt(channelId));

    if (startTime) {
      logs = logs.filter(l => new Date(l.callTime) >= new Date(startTime));
    }
    if (endTime) {
      logs = logs.filter(l => new Date(l.callTime) <= new Date(endTime));
    }

    logs.sort((a, b) => new Date(b.callTime) - new Date(a.callTime));

    const total = logs.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLogs = logs.slice(start, start + parseInt(limit));

    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCost,
      channel,
      logs: paginatedLogs
    });
  } catch (error) {
    console.error('Error getting channel call logs:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};