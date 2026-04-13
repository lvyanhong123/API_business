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