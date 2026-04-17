const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || '30d'
  });
};

exports.register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: '请填写完整信息（name, username, password）' });
  }

  if (!/^1[3-9]\d{9}$/.test(username)) {
    return res.status(400).json({ message: '请输入正确的手机号' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度不能少于6位' });
  }

  try {
    const existing = db.accounts.findByUsername(username);
    if (existing) {
      return res.status(400).json({ message: '该手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = db.accounts.create({
      name,
      username,
      password: hashedPassword,
      status: 'active'
    });

    const token = generateToken({ accountId: account.id });

    res.status(201).json({
      message: '注册成功',
      account: { id: account.id, name: account.name, username: account.username },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '请填写手机号和密码' });
  }

  try {
    const account = db.accounts.findByUsername(username);
    if (!account) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }

    if (account.status === 'inactive') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    const token = generateToken({ accountId: account.id });

    res.status(200).json({
      message: '登录成功',
      account: { id: account.id, name: account.name, username: account.username },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const account = db.accounts.findById(req.account.id);
    if (!account) {
      return res.status(404).json({ message: '账号不存在' });
    }

    const bindings = db.accountCustomers.findByAccountId(account.id);
    const customers = bindings.map(b => {
      const customer = db.customers.findById(b.customerId);
      return {
        bindingId: b.id,
        customerId: customer?.id,
        companyName: customer?.companyName,
        role: b.role,
        status: b.status,
        createdAt: b.createdAt
      };
    });

    res.status(200).json({
      account: {
        id: account.id,
        name: account.name,
        username: account.username,
        status: account.status,
        createdAt: account.createdAt
      },
      customers
    });
  } catch (error) {
    console.error('GetProfile error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.createCustomer = async (req, res) => {
  const { companyName, businessLicense, contact } = req.body;

  if (!companyName || !businessLicense || !contact?.email || !contact?.phone) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  try {
    const existingCustomer = db.customers.findOne({ businessLicense });
    if (existingCustomer) {
      return res.status(400).json({ message: '该营业执照号已被注册' });
    }

    const customer = db.customers.create({
      companyName,
      businessLicense,
      contact,
      status: 'active'
    });

    const binding = db.accountCustomers.create({
      accountId: req.account.id,
      customerId: customer.id,
      role: 'admin',
      status: 'active'
    });

    db.customerAccounts.create({
      customerId: customer.id,
      balance: 0,
      creditLimit: 0,
      paymentType: 'prepay'
    });

    res.status(201).json({
      message: '企业创建成功',
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        businessLicense: customer.businessLicense,
        contact: customer.contact
      },
      role: 'admin'
    });
  } catch (error) {
    console.error('CreateCustomer error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.applyBindCustomer = async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ message: '请提供企业ID' });
  }

  try {
    const customer = db.customers.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: '企业不存在' });
    }

    const existing = db.accountCustomers.findOne({
      accountId: req.account.id,
      customerId: customerId
    });
    if (existing) {
      return res.status(400).json({ message: '已绑定或待审批' });
    }

    const binding = db.accountCustomers.create({
      accountId: req.account.id,
      customerId: customerId,
      role: 'member',
      status: 'pending'
    });

    res.status(201).json({
      message: '申请已提交，请等待企业管理员审批',
      bindingId: binding.id
    });
  } catch (error) {
    console.error('ApplyBindCustomer error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.listPendingBinds = async (req, res) => {
  try {
    const accountId = req.account.id;
    const bindings = db.accountCustomers.findByAccountId(accountId);

    const pendingBindings = [];
    for (const b of bindings) {
      if (b.status === 'pending') {
        const customer = db.customers.findById(b.customerId);
        pendingBindings.push({
          bindingId: b.id,
          customerId: customer?.id,
          companyName: customer?.companyName,
          status: b.status,
          createdAt: b.createdAt
        });
      }
    }

    res.status(200).json({ pendingBindings });
  } catch (error) {
    console.error('ListPendingBinds error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.listCustomerAccounts = async (req, res) => {
  const { customerId } = req.params;

  try {
    const accountId = req.account.id;
    const binding = db.accountCustomers.findOne({
      accountId: accountId,
      customerId: parseInt(customerId),
      status: 'active'
    });

    if (!binding || binding.role !== 'admin') {
      return res.status(403).json({ message: '无权限查看该企业的账号列表' });
    }

    const bindings = db.accountCustomers.findByCustomerId(parseInt(customerId));
    const accounts = bindings.map(b => {
      const account = db.accounts.findById(b.accountId);
      return {
        bindingId: b.id,
        accountId: account?.id,
        name: account?.name,
        username: account?.username,
        role: b.role,
        status: b.status,
        createdAt: b.createdAt
      };
    });

    res.status(200).json({ accounts });
  } catch (error) {
    console.error('ListCustomerAccounts error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.approveBind = async (req, res) => {
  const { bindingId } = req.params;
  const { customerId } = req.body;

  try {
    const accountId = req.account.id;
    const adminBinding = db.accountCustomers.findOne({
      accountId: accountId,
      customerId: parseInt(customerId),
      role: 'admin',
      status: 'active'
    });

    if (!adminBinding) {
      return res.status(403).json({ message: '无权限审批' });
    }

    const binding = db.accountCustomers.findById(parseInt(bindingId));
    if (!binding || binding.customerId !== parseInt(customerId)) {
      return res.status(404).json({ message: '申请不存在' });
    }

    if (binding.status !== 'pending') {
      return res.status(400).json({ message: '该申请已处理' });
    }

    db.accountCustomers.update(binding.id, { status: 'active' });

    res.status(200).json({ message: '已通过审批' });
  } catch (error) {
    console.error('ApproveBind error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.rejectBind = async (req, res) => {
  const { bindingId } = req.params;
  const { customerId } = req.body;

  try {
    const accountId = req.account.id;
    const adminBinding = db.accountCustomers.findOne({
      accountId: accountId,
      customerId: parseInt(customerId),
      role: 'admin',
      status: 'active'
    });

    if (!adminBinding) {
      return res.status(403).json({ message: '无权限拒绝' });
    }

    const binding = db.accountCustomers.findById(parseInt(bindingId));
    if (!binding || binding.customerId !== parseInt(customerId)) {
      return res.status(404).json({ message: '申请不存在' });
    }

    if (binding.status !== 'pending') {
      return res.status(400).json({ message: '该申请已处理' });
    }

    db.accountCustomers.delete(binding.id);

    res.status(200).json({ message: '已拒绝' });
  } catch (error) {
    console.error('RejectBind error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.changeAdmin = async (req, res) => {
  const { customerId, newAdminAccountId } = req.body;

  if (!customerId || !newAdminAccountId) {
    return res.status(400).json({ message: '请提供企业ID和新管理员账号ID' });
  }

  try {
    const accountId = req.account.id;
    const currentAdminBinding = db.accountCustomers.findOne({
      accountId: accountId,
      customerId: parseInt(customerId),
      role: 'admin',
      status: 'active'
    });

    if (!currentAdminBinding) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const newAdminBinding = db.accountCustomers.findOne({
      accountId: parseInt(newAdminAccountId),
      customerId: parseInt(customerId),
      status: 'active'
    });

    if (!newAdminBinding) {
      return res.status(404).json({ message: '该账号未绑定到本企业' });
    }

    db.accountCustomers.update(currentAdminBinding.id, { role: 'member' });
    db.accountCustomers.update(newAdminBinding.id, { role: 'admin' });

    res.status(200).json({ message: '管理员已变更' });
  } catch (error) {
    console.error('ChangeAdmin error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.unbindCustomer = async (req, res) => {
  const { bindingId } = req.params;

  try {
    const accountId = req.account.id;
    const binding = db.accountCustomers.findById(parseInt(bindingId));

    if (!binding || binding.accountId !== accountId) {
      return res.status(404).json({ message: '绑定关系不存在' });
    }

    if (binding.role === 'admin') {
      const otherAdmins = db.accountCustomers.findByCustomerId(binding.customerId)
        .filter(b => b.role === 'admin' && b.id !== binding.id && b.status === 'active');
      if (otherAdmins.length === 0) {
        return res.status(400).json({ message: '请先指定新管理员再解绑' });
      }
    }

    db.accountCustomers.delete(binding.id);

    res.status(200).json({ message: '已解绑' });
  } catch (error) {
    console.error('UnbindCustomer error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getApiKeys = async (req, res) => {
  const { customerId } = req.query;

  try {
    const accountId = req.account.id;

    if (customerId) {
      const binding = db.accountCustomers.findOne({
        accountId: accountId,
        customerId: parseInt(customerId),
        status: 'active'
      });

      if (!binding) {
        return res.status(403).json({ message: '未绑定该企业' });
      }

      const keys = db.apiKeys.findByCustomerId(parseInt(customerId));
      return res.status(200).json({ keys, type: 'enterprise' });
    }

    const personalKeys = db.apiKeys.findByAccountId(accountId);
    res.status(200).json({ keys: personalKeys, type: 'personal' });
  } catch (error) {
    console.error('GetApiKeys error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.regenerateApiKey = async (req, res) => {
  const { customerId, productId } = req.body;

  try {
    const accountId = req.account.id;

    if (customerId) {
      const binding = db.accountCustomers.findOne({
        accountId: accountId,
        customerId: parseInt(customerId),
        status: 'active'
      });

      if (!binding) {
        return res.status(403).json({ message: '未绑定该企业' });
      }

      const apiKey = 'AK' + Date.now() + Math.random().toString(36).substr(2, 20);
      const apiSecret = Math.random().toString(36).substr(2, 32);

      const newKey = db.apiKeys.create({
        customerId: parseInt(customerId),
        productId: productId ? parseInt(productId) : null,
        apiKey,
        apiSecret,
        status: 'active'
      });

      return res.status(200).json({ message: '企业API密钥已生成', key: newKey });
    }

    const apiKey = 'AK' + Date.now() + Math.random().toString(36).substr(2, 20);
    const apiSecret = Math.random().toString(36).substr(2, 32);

    const newKey = db.apiKeys.create({
      accountId: accountId,
      productId: productId ? parseInt(productId) : null,
      apiKey,
      apiSecret,
      status: 'active'
    });

    res.status(200).json({ message: '个人API密钥已生成', key: newKey });
  } catch (error) {
    console.error('RegenerateApiKey error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
