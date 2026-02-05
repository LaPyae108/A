const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// =================== MULTER CONFIG ===================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 🔍 SHOW ALL PRODUCTS
router.get('/', async (req, res) => {
  const search = req.query.search || '';
  const products = await Product.find({
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { productId: { $regex: search, $options: 'i' } }
    ]
  });
  res.render('products', { products, search });
});

// ➕ ADD PRODUCT PAGE
router.get('/add', isLoggedIn, isAdmin, (req, res) => {
  res.render('add-product');
});

// ➕ ADD PRODUCT
router.post('/add', isLoggedIn, isAdmin, upload.array('images', 6), async (req, res) => {
  const { productId, name, price, description } = req.body;

  if (await Product.findOne({ productId })) {
    return res.status(400).send('Product ID exists');
  }

  const images = req.files.map(file => '/uploads/' + file.filename);

  await Product.create({
    productId,
    name,
    price,
    description,
    images
  });

  res.redirect('/products');
});

// ✏️ EDIT PRODUCT PAGE
router.get('/:id/edit', isLoggedIn, isAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render('edit-product', { product });
});

// ✏️ UPDATE PRODUCT
router.put('/:id', isLoggedIn, isAdmin, upload.array('images', 6), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');

    product.productId = req.body.productId;
    product.name = req.body.name;
    product.price = req.body.price;
    product.description = req.body.description;

    // ✅ append images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => '/uploads/' + file.filename);
      product.images.push(...newImages);
    }

    await product.save();
    res.redirect('/products/' + product._id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Update failed');
  }
});



// 🗑 DELETE PRODUCT
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send('Product not found');

  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      const imgPath = path.join(__dirname, '../public', img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });
  }

  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/products');
});

// PRODUCT DETAILS PAGE
router.get('/:id', async function (req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    res.render('product-details', {
      product: product
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
