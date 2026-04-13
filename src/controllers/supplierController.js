const db = require('../config/database');

exports.createSupplier = async (req, res) => {
  const { internalName, name, contact, phone, email, address, channelContact } = req.body;

  try {
    if (!internalName) {
      return res.status(400).json({ message: '内部供应商名称不能为空' });
    }

    const existing = db.suppliers.findOne({ internalName });
    if (existing) {
      return res.status(400).json({ message: '内部供应商名称已存在' });
    }

    const supplier = db.suppliers.create({
      internalName,
      name: name || '',
      contact: contact || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      channelContact: channelContact || '',
      status: 'active'
    });

    res.status(201).json({ message: '供应商创建成功', supplier });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getSuppliers = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    let suppliers = db.suppliers.findAll();
    if (status) suppliers = suppliers.filter(s => s.status === status);

    const total = suppliers.length;
    const start = (page - 1) * limit;
    const paginatedSuppliers = suppliers.slice(start, start + parseInt(limit));

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      suppliers: paginatedSuppliers
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getSupplier = async (req, res) => {
  const { id } = req.params;

  try {
    const supplier = db.suppliers.findById(parseInt(id));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { internalName, name, contact, phone, email, address, channelContact, status } = req.body;

  try {
    const supplier = db.suppliers.findById(parseInt(id));
    if (!supplier) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    if (internalName && internalName !== supplier.internalName) {
      const existing = db.suppliers.findOne({ internalName });
      if (existing && existing.id !== parseInt(id)) {
        return res.status(400).json({ message: '内部供应商名称已存在' });
      }
    }

    const updated = db.suppliers.update(parseInt(id), {
      internalName: internalName !== undefined ? internalName : supplier.internalName,
      name: name !== undefined ? name : supplier.name,
      contact: contact !== undefined ? contact : supplier.contact,
      phone: phone !== undefined ? phone : supplier.phone,
      email: email !== undefined ? email : supplier.email,
      address: address !== undefined ? address : supplier.address,
      channelContact: channelContact !== undefined ? channelContact : supplier.channelContact,
      status: status || supplier.status
    });

    res.status(200).json({ message: '供应商更新成功', supplier: updated });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.deleteSupplier = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = db.suppliers.delete(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ message: '供应商不存在' });
    }

    res.status(200).json({ message: '供应商删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
