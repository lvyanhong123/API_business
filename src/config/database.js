const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.json');

const defaultData = {
  admins: [],
  suppliers: [],
  channels: [],
  products: [],
  customers: [],
  orders: [],
  apiLogs: []
};

let db = null;

function loadDb() {
  if (db) return db;

  if (!fs.existsSync(dbPath)) {
    db = { ...defaultData };
    saveDb();
  } else {
    try {
      const content = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(content);
    } catch (e) {
      db = { ...defaultData };
    }
  }
  return db;
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function getNextId(collection) {
  const data = loadDb();
  if (data[collection].length === 0) return 1;
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
      const id = getNextId('admins');
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
      const id = getNextId('suppliers');
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
      const id = getNextId('channels');
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
      const id = getNextId('products');
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
      const id = getNextId('customers');
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
      const id = getNextId('orders');
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

  apiLogs: {
    findAll: () => loadDb().apiLogs,
    findById: (id) => loadDb().apiLogs.find(l => l.id === id),
    create: (data) => {
      const newData = loadDb();
      const id = getNextId('apiLogs');
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
  }
};

module.exports = dbUtils;