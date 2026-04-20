const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.json');

const defaultData = {
  admins: [],
  suppliers: [],
  channels: [],
  products: [],
  productChannels: [],
  responseCodeMappings: [],
  accounts: [],
  accountCustomers: [],
  customers: [],
  customerAccounts: [],
  orders: [],
  apiKeys: [],
  apiLogs: [],
  paymentOrders: [],
  refundOrders: [],
  withdrawOrders: [],
  customerBills: [],
  customerBillItems: [],
  adminChangeRequests: [],
  accountProductQuotas: [],
  autoRenewalConfigs: []
};

let db = null;

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(content);
    } else {
      db = { ...defaultData };
      saveDb();
    }
  } catch (e) {
    db = { ...defaultData };
  }
  return db;
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function getNextId(data, collection) {
  if (!data[collection] || data[collection].length === 0) return 1;
  return Math.max(...data[collection].map(item => item.id)) + 1;
}

const dbUtils = {
  load: loadDb,
  save: saveDb,

  admins: {
    findAll: () => loadDb().admins,
    findById: (id) => loadDb().admins.find(a => a.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.admins.find(a => {
        for (const key in where) {
          if (a[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'admins');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.admins.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.admins.findIndex(a => a.id === id);
      if (index === -1) return null;
      newData.admins[index] = { ...newData.admins[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.admins[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.admins.findIndex(a => a.id === id);
      if (index === -1) return false;
      newData.admins.splice(index, 1);
      saveDb();
      return true;
    }
  },

  suppliers: {
    findAll: () => loadDb().suppliers,
    findById: (id) => loadDb().suppliers.find(s => s.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.suppliers.find(s => {
        for (const key in where) {
          if (s[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'suppliers');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.suppliers.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.suppliers.findIndex(s => s.id === id);
      if (index === -1) return null;
      newData.suppliers[index] = { ...newData.suppliers[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.suppliers[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.suppliers.findIndex(s => s.id === id);
      if (index === -1) return false;
      newData.suppliers.splice(index, 1);
      saveDb();
      return true;
    }
  },

  channels: {
    findAll: () => loadDb().channels,
    findById: (id) => loadDb().channels.find(c => c.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.channels.find(c => {
        for (const key in where) {
          if (c[key] !== where[key]) return false;
        }
        return true;
      });
    },
    findBySupplier: (supplierId) => loadDb().channels.filter(c => c.supplierId === supplierId),
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'channels');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.channels.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.channels.findIndex(c => c.id === id);
      if (index === -1) return null;
      newData.channels[index] = { ...newData.channels[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.channels[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.channels.findIndex(c => c.id === id);
      if (index === -1) return false;
      newData.channels.splice(index, 1);
      saveDb();
      return true;
    },
    count: () => loadDb().channels.length
  },

  products: {
    findAll: () => loadDb().products,
    findById: (id) => loadDb().products.find(p => p.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.products.find(p => {
        for (const key in where) {
          if (p[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'products');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.products.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.products.findIndex(p => p.id === id);
      if (index === -1) return null;
      newData.products[index] = { ...newData.products[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.products[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.products.findIndex(p => p.id === id);
      if (index === -1) return false;
      newData.products.splice(index, 1);
      saveDb();
      return true;
    },
    count: (where) => {
      if (!where) return loadDb().products.length;
      const data = loadDb();
      return data.products.filter(p => {
        for (const key in where) {
          if (p[key] !== where[key]) return false;
        }
        return true;
      }).length;
    }
  },

  productChannels: {
    findAll: () => loadDb().productChannels || [],
    findById: (id) => loadDb().productChannels?.find(pc => pc.id === id),
    findByProductId: (productId) => (loadDb().productChannels || []).filter(pc => pc.productId === productId),
    findByChannelId: (channelId) => (loadDb().productChannels || []).filter(pc => pc.channelId === channelId),
    findByProductIdAndChannelId: (productId, channelId) => (loadDb().productChannels || []).find(pc => pc.productId === productId && pc.channelId === channelId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.productChannels) newData.productChannels = [];
      const id = getNextId(newData, 'productChannels');
      const item = { id, ...data, createdAt: new Date() };
      newData.productChannels.push(item);
      saveDb();
      return item;
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.productChannels?.findIndex(pc => pc.id === id);
      if (index === -1 || index === undefined) return false;
      newData.productChannels.splice(index, 1);
      saveDb();
      return true;
    },
    deleteByProductId: (productId) => {
      const newData = loadDb();
      newData.productChannels = (newData.productChannels || []).filter(pc => pc.productId !== productId);
      saveDb();
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.productChannels?.findIndex(pc => pc.id === id);
      if (index === -1 || index === undefined) return null;
      newData.productChannels[index] = { ...newData.productChannels[index], ...data };
      saveDb();
      return newData.productChannels[index];
    }
  },

  responseCodeMappings: {
    findAll: () => loadDb().responseCodeMappings || [],
    findById: (id) => loadDb().responseCodeMappings?.find(m => m.id === id),
    findByChannelId: (channelId) => (loadDb().responseCodeMappings || []).filter(m => m.channelId === channelId),
    findByChannelIdAndSourceCode: (channelId, sourceCode) => (loadDb().responseCodeMappings || []).find(m => m.channelId === channelId && m.sourceCode === sourceCode),
    create: (data) => {
      const newData = loadDb();
      if (!newData.responseCodeMappings) newData.responseCodeMappings = [];
      const id = getNextId(newData, 'responseCodeMappings');
      const item = { id, ...data, createdAt: new Date() };
      newData.responseCodeMappings.push(item);
      saveDb();
      return item;
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.responseCodeMappings?.findIndex(m => m.id === id);
      if (index === -1 || index === undefined) return false;
      newData.responseCodeMappings.splice(index, 1);
      saveDb();
      return true;
    },
    deleteByChannelId: (channelId) => {
      const newData = loadDb();
      newData.responseCodeMappings = (newData.responseCodeMappings || []).filter(m => m.channelId !== channelId);
      saveDb();
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.responseCodeMappings?.findIndex(m => m.id === id);
      if (index === -1 || index === undefined) return null;
      newData.responseCodeMappings[index] = { ...newData.responseCodeMappings[index], ...data };
      saveDb();
      return newData.responseCodeMappings[index];
    }
  },

  accounts: {
    findAll: () => loadDb().accounts || [],
    findById: (id) => loadDb().accounts?.find(a => a.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.accounts.find(a => {
        for (const key in where) {
          if (a[key] !== where[key]) return false;
        }
        return true;
      });
    },
    findByUsername: (username) => loadDb().accounts?.find(a => a.username === username),
    create: (data) => {
      const newData = loadDb();
      if (!newData.accounts) newData.accounts = [];
      const id = getNextId(newData, 'accounts');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.accounts.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.accounts?.findIndex(a => a.id === id);
      if (index === -1 || index === undefined) return null;
      newData.accounts[index] = { ...newData.accounts[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.accounts[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.accounts?.findIndex(a => a.id === id);
      if (index === -1 || index === undefined) return false;
      newData.accounts.splice(index, 1);
      saveDb();
      return true;
    }
  },

  accountCustomers: {
    findAll: () => loadDb().accountCustomers || [],
    findById: (id) => loadDb().accountCustomers?.find(ac => ac.id === id),
    findByAccountId: (accountId) => (loadDb().accountCustomers || []).filter(ac => ac.accountId === accountId),
    findByCustomerId: (customerId) => (loadDb().accountCustomers || []).filter(ac => ac.customerId === customerId),
    findOne: (where) => {
      const data = loadDb();
      return data.accountCustomers?.find(ac => {
        for (const key in where) {
          if (ac[key] !== where[key]) return false;
        }
        return true;
      });
    },
    findActiveByAccountId: (accountId) => (loadDb().accountCustomers || []).filter(ac => ac.accountId === accountId && ac.status === 'active'),
    findActiveByCustomerId: (customerId) => (loadDb().accountCustomers || []).filter(ac => ac.customerId === customerId && ac.status === 'active'),
    findAdminByCustomerId: (customerId) => (loadDb().accountCustomers || []).find(ac => ac.customerId === customerId && ac.role === 'admin' && ac.status === 'active'),
    create: (data) => {
      const newData = loadDb();
      if (!newData.accountCustomers) newData.accountCustomers = [];
      const id = getNextId(newData, 'accountCustomers');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.accountCustomers.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.accountCustomers?.findIndex(ac => ac.id === id);
      if (index === -1 || index === undefined) return null;
      newData.accountCustomers[index] = { ...newData.accountCustomers[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.accountCustomers[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.accountCustomers?.findIndex(ac => ac.id === id);
      if (index === -1 || index === undefined) return false;
      newData.accountCustomers.splice(index, 1);
      saveDb();
      return true;
    },
    deleteByAccountId: (accountId) => {
      const newData = loadDb();
      newData.accountCustomers = (newData.accountCustomers || []).filter(ac => ac.accountId !== accountId);
      saveDb();
    },
    deleteByCustomerId: (customerId) => {
      const newData = loadDb();
      newData.accountCustomers = (newData.accountCustomers || []).filter(ac => ac.customerId !== customerId);
      saveDb();
    }
  },

  customers: {
    findAll: () => loadDb().customers,
    findById: (id) => loadDb().customers.find(c => c.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.customers.find(c => {
        for (const key in where) {
          if (c[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'customers');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.customers.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.customers.findIndex(c => c.id === id);
      if (index === -1) return null;
      newData.customers[index] = { ...newData.customers[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.customers[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.customers.findIndex(c => c.id === id);
      if (index === -1) return false;
      newData.customers.splice(index, 1);
      saveDb();
      return true;
    },
    count: () => loadDb().customers.length
  },

  customerAccounts: {
    findAll: () => loadDb().customerAccounts || [],
    findById: (id) => loadDb().customerAccounts?.find(ca => ca.id === id),
    findByCustomerId: (customerId) => (loadDb().customerAccounts || []).find(ca => ca.customerId === customerId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.customerAccounts) newData.customerAccounts = [];
      const id = getNextId(newData, 'customerAccounts');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.customerAccounts.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.customerAccounts?.findIndex(ca => ca.id === id);
      if (index === -1 || index === undefined) return null;
      newData.customerAccounts[index] = { ...newData.customerAccounts[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.customerAccounts[index];
    },
    updateByCustomerId: (customerId, data) => {
      const newData = loadDb();
      const index = newData.customerAccounts?.findIndex(ca => ca.customerId === customerId);
      if (index === -1 || index === undefined) return null;
      newData.customerAccounts[index] = { ...newData.customerAccounts[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.customerAccounts[index];
    }
  },

  paymentOrders: {
    findAll: () => loadDb().paymentOrders || [],
    findById: (id) => loadDb().paymentOrders?.find(p => p.id === id),
    findByCustomerId: (customerId) => (loadDb().paymentOrders || []).filter(p => p.customerId === customerId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.paymentOrders) newData.paymentOrders = [];
      const id = getNextId(newData, 'paymentOrders');
      const item = { id, ...data, createdAt: new Date() };
      newData.paymentOrders.push(item);
      saveDb();
      return item;
    },
    update: (id, updateData) => {
      const newData = loadDb();
      const index = newData.paymentOrders.findIndex(p => p.id === id);
      if (index === -1) return null;
      newData.paymentOrders[index] = { ...newData.paymentOrders[index], ...updateData };
      saveDb();
      return newData.paymentOrders[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.paymentOrders.findIndex(p => p.id === id);
      if (index === -1) return false;
      newData.paymentOrders.splice(index, 1);
      saveDb();
      return true;
    }
  },

  refundOrders: {
    findAll: () => loadDb().refundOrders || [],
    findById: (id) => loadDb().refundOrders?.find(r => r.id === id),
    findByCustomerId: (customerId) => (loadDb().refundOrders || []).filter(r => r.customerId === customerId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.refundOrders) newData.refundOrders = [];
      const id = getNextId(newData, 'refundOrders');
      const item = { id, ...data, createdAt: new Date() };
      newData.refundOrders.push(item);
      saveDb();
      return item;
    }
  },

  withdrawOrders: {
    findAll: () => loadDb().withdrawOrders || [],
    findById: (id) => loadDb().withdrawOrders?.find(r => r.id === id),
    findByCustomerId: (customerId) => (loadDb().withdrawOrders || []).filter(r => r.customerId === customerId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.withdrawOrders) newData.withdrawOrders = [];
      const id = getNextId(newData, 'withdrawOrders');
      const item = { id, ...data, createdAt: new Date() };
      newData.withdrawOrders.push(item);
      saveDb();
      return item;
    },
    update: (id, updateData) => {
      const newData = loadDb();
      const index = newData.withdrawOrders.findIndex(r => r.id === id);
      if (index === -1) return null;
      newData.withdrawOrders[index] = { ...newData.withdrawOrders[index], ...updateData };
      saveDb();
      return newData.withdrawOrders[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.withdrawOrders.findIndex(r => r.id === id);
      if (index === -1) return false;
      newData.withdrawOrders.splice(index, 1);
      saveDb();
      return true;
    }
  },

  customerBills: {
    findAll: () => loadDb().customerBills || [],
    findById: (id) => loadDb().customerBills?.find(b => b.id === id),
    findByCustomerId: (customerId) => (loadDb().customerBills || []).filter(b => b.customerId === customerId),
    findByPeriod: (period) => (loadDb().customerBills || []).filter(b => b.period === period),
    findByCustomerIdAndPeriod: (customerId, period) => (loadDb().customerBills || []).find(b => b.customerId === customerId && b.period === period),
    create: (data) => {
      const newData = loadDb();
      if (!newData.customerBills) newData.customerBills = [];
      const id = getNextId(newData, 'customerBills');
      const item = { id, ...data, createdAt: new Date() };
      newData.customerBills.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.customerBills?.findIndex(b => b.id === id);
      if (index === -1 || index === undefined) return null;
      newData.customerBills[index] = { ...newData.customerBills[index], ...data };
      saveDb();
      return newData.customerBills[index];
    }
  },

  customerBillItems: {
    findAll: () => loadDb().customerBillItems || [],
    findByBillId: (billId) => (loadDb().customerBillItems || []).filter(i => i.billId === billId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.customerBillItems) newData.customerBillItems = [];
      const id = getNextId(newData, 'customerBillItems');
      const item = { id, ...data };
      newData.customerBillItems.push(item);
      saveDb();
      return item;
    }
  },

  orders: {
    findAll: () => loadDb().orders,
    findById: (id) => loadDb().orders.find(o => o.id === id),
    findOne: (where) => {
      const data = loadDb();
      return data.orders.find(o => {
        for (const key in where) {
          if (o[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'orders');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.orders.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      newData.orders[index] = { ...newData.orders[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.orders[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.orders.findIndex(o => o.id === id);
      if (index === -1) return false;
      newData.orders.splice(index, 1);
      saveDb();
      return true;
    },
    count: () => loadDb().orders.length
  },

  apiKeys: {
    findAll: () => loadDb().apiKeys || [],
    findById: (id) => loadDb().apiKeys?.find(k => k.id === id),
    findByApiKey: (apiKey) => (loadDb().apiKeys || []).find(k => k.apiKey === apiKey),
    findByCustomerId: (customerId) => (loadDb().apiKeys || []).filter(k => k.customerId === customerId),
    findByAccountId: (accountId) => (loadDb().apiKeys || []).filter(k => k.accountId === accountId),
    findByProductId: (productId) => (loadDb().apiKeys || []).filter(k => k.productId === productId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.apiKeys) newData.apiKeys = [];
      const id = getNextId(newData, 'apiKeys');
      const item = { id, ...data, createdAt: new Date() };
      newData.apiKeys.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.apiKeys?.findIndex(k => k.id === id);
      if (index === -1 || index === undefined) return null;
      newData.apiKeys[index] = { ...newData.apiKeys[index], ...data };
      saveDb();
      return newData.apiKeys[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.apiKeys?.findIndex(k => k.id === id);
      if (index === -1 || index === undefined) return false;
      newData.apiKeys.splice(index, 1);
      saveDb();
      return true;
    }
  },

  apiLogs: {
    findAll: () => loadDb().apiLogs,
    findById: (id) => loadDb().apiLogs.find(l => l.id === id),
    create: (data) => {
      const newData = loadDb();
      const id = getNextId(newData, 'apiLogs');
      const item = { id, ...data, createdAt: new Date() };
      newData.apiLogs.push(item);
      saveDb();
      return item;
    },
    count: (where) => {
      if (!where) return loadDb().apiLogs.length;
      const data = loadDb();
      return data.apiLogs.filter(l => {
        for (const key in where) {
          if (l[key] !== where[key]) return false;
        }
        return true;
      }).length;
    }
  },

  callLogs: {
    findAll: () => loadDb().callLogs || [],
    findById: (id) => loadDb().callLogs?.find(l => l.id === id),
    findByChannel: (channelId) => (loadDb().callLogs || []).filter(l => l.channelId === channelId),
    findBySupplier: (supplierId) => (loadDb().callLogs || []).filter(l => l.supplierId === supplierId),
    findByTimeRange: (startTime, endTime) => (loadDb().callLogs || []).filter(l => {
      const callTime = new Date(l.callTime);
      return callTime >= new Date(startTime) && callTime <= new Date(endTime);
    }),
    create: (data) => {
      const newData = loadDb();
      if (!newData.callLogs) newData.callLogs = [];
      const id = getNextId(newData, 'callLogs');
      const item = { id, ...data, createdAt: new Date() };
      newData.callLogs.push(item);
      saveDb();
      return item;
    },
    count: (where) => {
      const logs = loadDb().callLogs || [];
      if (!where) return logs.length;
      return logs.filter(l => {
        for (const key in where) {
          if (l[key] !== where[key]) return false;
        }
        return true;
      }).length;
    },
    aggregateByChannel: (startTime, endTime) => {
      const logs = (loadDb().callLogs || []).filter(l => {
        const callTime = new Date(l.callTime);
        return callTime >= new Date(startTime) && callTime <= new Date(endTime);
      });
      const grouped = {};
      logs.forEach(log => {
        if (!grouped[log.channelId]) {
          grouped[log.channelId] = { channelId: log.channelId, supplierId: log.supplierId, callCount: 0, totalCost: 0 };
        }
        grouped[log.channelId].callCount++;
        grouped[log.channelId].totalCost += log.cost || 0;
      });
      return Object.values(grouped);
    }
  },

  supplierBills: {
    findAll: () => loadDb().supplierBills || [],
    findById: (id) => loadDb().supplierBills?.find(b => b.id === id),
    findBySupplier: (supplierId) => (loadDb().supplierBills || []).filter(b => b.supplierId === supplierId),
    findByStatus: (status) => (loadDb().supplierBills || []).filter(b => b.status === status),
    create: (data) => {
      const newData = loadDb();
      if (!newData.supplierBills) newData.supplierBills = [];
      const id = getNextId(newData, 'supplierBills');
      const item = { id, ...data, createdAt: new Date() };
      newData.supplierBills.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.supplierBills?.findIndex(b => b.id === id);
      if (index === -1 || index === undefined) return null;
      newData.supplierBills[index] = { ...newData.supplierBills[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.supplierBills[index];
    },
    findByPeriod: (supplierId, periodStart, periodEnd) => {
      return (loadDb().supplierBills || []).find(b =>
        b.supplierId === supplierId &&
        b.periodStart === periodStart &&
        b.periodEnd === periodEnd
      );
    }
  },

  billItems: {
    findAll: () => loadDb().billItems || [],
    findByBillId: (billId) => (loadDb().billItems || []).filter(i => i.billId === billId),
    create: (data) => {
      const newData = loadDb();
      if (!newData.billItems) newData.billItems = [];
      const id = getNextId(newData, 'billItems');
      const item = { id, ...data };
      newData.billItems.push(item);
      saveDb();
      return item;
    },
    createMany: (items) => {
      const newData = loadDb();
      if (!newData.billItems) newData.billItems = [];
      const created = items.map(item => {
        const id = getNextId(newData, 'billItems');
        const newItem = { id, ...item };
        newData.billItems.push(newItem);
        return newItem;
      });
      saveDb();
      return created;
    }
  },

  adminChangeRequests: {
    findAll: () => loadDb().adminChangeRequests || [],
    findById: (id) => loadDb().adminChangeRequests?.find(r => r.id === id),
    findByCustomerId: (customerId) => (loadDb().adminChangeRequests || []).filter(r => r.customerId === customerId),
    findPending: () => (loadDb().adminChangeRequests || []).filter(r => r.status === 'pending'),
    findOne: (where) => {
      const data = loadDb();
      return data.adminChangeRequests?.find(r => {
        for (const key in where) {
          if (r[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      if (!newData.adminChangeRequests) newData.adminChangeRequests = [];
      const id = getNextId(newData, 'adminChangeRequests');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.adminChangeRequests.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.adminChangeRequests?.findIndex(r => r.id === id);
      if (index === -1 || index === undefined) return null;
      newData.adminChangeRequests[index] = { ...newData.adminChangeRequests[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.adminChangeRequests[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.adminChangeRequests?.findIndex(r => r.id === id);
      if (index === -1 || index === undefined) return false;
      newData.adminChangeRequests.splice(index, 1);
      saveDb();
      return true;
    }
  },

  accountProductQuotas: {
    findAll: () => loadDb().accountProductQuotas || [],
    findById: (id) => loadDb().accountProductQuotas?.find(q => q.id === id),
    findByAccountId: (accountId) => (loadDb().accountProductQuotas || []).filter(q => q.accountId === accountId),
    findByProductId: (productId) => (loadDb().accountProductQuotas || []).filter(q => q.productId === productId),
    findOne: (where) => {
      const data = loadDb();
      return data.accountProductQuotas?.find(q => {
        for (const key in where) {
          if (q[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      if (!newData.accountProductQuotas) newData.accountProductQuotas = [];
      const id = getNextId(newData, 'accountProductQuotas');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.accountProductQuotas.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.accountProductQuotas?.findIndex(q => q.id === id);
      if (index === -1 || index === undefined) return null;
      newData.accountProductQuotas[index] = { ...newData.accountProductQuotas[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.accountProductQuotas[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.accountProductQuotas?.findIndex(q => q.id === id);
      if (index === -1 || index === undefined) return false;
      newData.accountProductQuotas.splice(index, 1);
      saveDb();
      return true;
    }
  },

  autoRenewalConfigs: {
    findAll: () => loadDb().autoRenewalConfigs || [],
    findById: (id) => loadDb().autoRenewalConfigs?.find(c => c.id === id),
    findByAccountId: (accountId) => (loadDb().autoRenewalConfigs || []).filter(c => c.accountId === accountId),
    findByProductId: (productId) => (loadDb().autoRenewalConfigs || []).filter(c => c.productId === productId),
    findOne: (where) => {
      const data = loadDb();
      return data.autoRenewalConfigs?.find(c => {
        for (const key in where) {
          if (c[key] !== where[key]) return false;
        }
        return true;
      });
    },
    create: (data) => {
      const newData = loadDb();
      if (!newData.autoRenewalConfigs) newData.autoRenewalConfigs = [];
      const id = getNextId(newData, 'autoRenewalConfigs');
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      newData.autoRenewalConfigs.push(item);
      saveDb();
      return item;
    },
    update: (id, data) => {
      const newData = loadDb();
      const index = newData.autoRenewalConfigs?.findIndex(c => c.id === id);
      if (index === -1 || index === undefined) return null;
      newData.autoRenewalConfigs[index] = { ...newData.autoRenewalConfigs[index], ...data, updatedAt: new Date() };
      saveDb();
      return newData.autoRenewalConfigs[index];
    },
    delete: (id) => {
      const newData = loadDb();
      const index = newData.autoRenewalConfigs?.findIndex(c => c.id === id);
      if (index === -1 || index === undefined) return false;
      newData.autoRenewalConfigs.splice(index, 1);
      saveDb();
      return true;
    }
  }
};

module.exports = dbUtils;