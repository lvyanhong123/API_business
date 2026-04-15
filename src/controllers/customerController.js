const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || '30d'
  });
};

exports.register = async (req, res) => {
  const { companyName, businessLicense, contact, password } = req.body;

  if (!companyName || !businessLicense || !contact?.email || !contact?.phone || !password) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度不能少于6位' });
  }

  try {
    const existing = db.customers.findOne({ businessLicense });
    if (existing) {
      return res.status(400).json({ message: '营业执照号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = db.customers.create({
      companyName, businessLicense, contact, password: hashedPassword, quota: 0, status: 'active'
    });

    const token = generateToken(customer.id);

    res.status(201).json({
      message: '注册成功',
      customer: { id: customer.id, companyName, businessLicense, contact },
      token
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.login = async (req, res) => {
  const { businessLicense, password } = req.body;

  if (!businessLicense || !password) {
    return res.status(400).json({ message: '请填写营业执照号和密码' });
  }

  try {
    const customer = db.customers.findOne({ businessLicense });
    if (!customer) {
      return res.status(400).json({ message: '营业执照号或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: '营业执照号或密码错误' });
    }

    if (customer.status === 'inactive') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    const token = generateToken(customer.id);

    res.status(200).json({
      message: '登录成功',
      customer: { id: customer.id, companyName: customer.companyName, businessLicense, contact: customer.contact, status: customer.status },
      token
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = db.customers.findById(req.customer.id);
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    res.status(200).json({
      customer: { id: customer.id, companyName: customer.companyName, businessLicense: customer.businessLicense, contact: customer.contact, status: customer.status, quota: customer.quota, createdAt: customer.createdAt }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getApiKeys = async (req, res) => {
  try {
    const customer = db.customers.findById(req.customer.id);
    if (!customer || !customer.appId || !customer.appSecret) {
      return res.status(400).json({ message: '暂无可用API密钥，请联系管理员' });
    }

    res.status(200).json({ appId: customer.appId, appSecret: customer.appSecret });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.regenerateApiKey = async (req, res) => {
  try {
    const customer = db.customers.findById(req.customer.id);
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    const appId = 'APP' + Date.now() + Math.random().toString(36).substr(2, 9);
    const appSecret = 'SK' + Math.random().toString(36).substr(2, 32);

    db.customers.update(req.customer.id, { appId, appSecret });

    res.status(200).json({ message: 'API密钥已重新生成', appId, appSecret });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getQuota = async (req, res) => {
  try {
    const customer = db.customers.findById(req.customer.id);
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    res.status(200).json({ quota: customer.quota });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};