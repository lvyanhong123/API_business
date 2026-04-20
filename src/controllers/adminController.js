const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const admin = db.admins.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const token = generateToken(admin.id);

    res.status(200).json({
      message: '登录成功',
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, role } = req.body;

  try {
    const existing = db.admins.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = db.admins.create({
      username,
      password: hashedPassword,
      role: role || 'admin'
    });

    const token = generateToken(admin.id);

    res.status(201).json({
      message: '管理员创建成功',
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.listAdminChangeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let requests = db.adminChangeRequests.findAll();

    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    const result = requests.map(r => {
      const customer = db.customers.findById(r.customerId);
      const currentAdmin = db.accounts.findById(r.currentAdminAccountId);
      const newAdmin = db.accounts.findById(r.newAdminAccountId);
      return {
        ...r,
        companyName: customer?.companyName || '-',
        currentAdminName: currentAdmin?.name || '-',
        newAdminName: newAdmin?.name || '-'
      };
    });

    res.status(200).json({ requests: result });
  } catch (error) {
    console.error('ListAdminChangeRequests error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.approveAdminChange = async (req, res) => {
  const { id } = req.params;

  try {
    const request = db.adminChangeRequests.findById(parseInt(id));
    if (!request) {
      return res.status(404).json({ message: '申请不存在' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: '该申请已处理' });
    }

    const currentBinding = db.accountCustomers.findOne({
      accountId: request.currentAdminAccountId,
      customerId: request.customerId
    });
    if (currentBinding) {
      db.accountCustomers.update(currentBinding.id, { role: 'member' });
    }

    const newBinding = db.accountCustomers.findOne({
      accountId: request.newAdminAccountId,
      customerId: request.customerId
    });
    if (newBinding) {
      db.accountCustomers.update(newBinding.id, { role: 'admin' });
    }

    db.adminChangeRequests.update(parseInt(id), {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.admin.id
    });

    res.status(200).json({ message: '已通过审批' });
  } catch (error) {
    console.error('ApproveAdminChange error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.rejectAdminChange = async (req, res) => {
  const { id } = req.params;

  try {
    const request = db.adminChangeRequests.findById(parseInt(id));
    if (!request) {
      return res.status(404).json({ message: '申请不存在' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: '该申请已处理' });
    }

    db.adminChangeRequests.update(parseInt(id), {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.admin.id
    });

    res.status(200).json({ message: '已拒绝' });
  } catch (error) {
    console.error('RejectAdminChange error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};