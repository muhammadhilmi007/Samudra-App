const mongoose = require("mongoose");
const Product = mongoose.model("Product", require("../schemas/productSchema"));
const User = mongoose.model("User", require("../schemas/userSchema"));

// List all products based on user's branch
const index = async (req, res) => {
  try {
    // Get current user
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    // Filter products by user's branch
    const products = await Product.find({ branch_id: currentUser.branch_id })
      .populate('branch_id')
      .populate('created_by', 'name')
      .sort({ name: 1 });

    res.render("../views/products/index", {
      title: "Products",
      products: products,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load products!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = (req, res) => {
  res.render("../views/products/create", {
    title: "Create Product",
    layout: "../views/layout/app.ejs"
  });
};

// Store new product
const store = async (req, res) => {
  try {
    // Get current user
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    const product = new Product({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      unit: req.body.unit,
      category: req.body.category,
      branch_id: currentUser.branch_id, // Product belongs to user's branch
      created_by: currentUser._id,
      isActive: req.body.isActive === 'on'
    });

    await product.save();
    req.session.successMessage = "Product created successfully!";
    res.redirect(res.locals.base + "products");
  } catch (error) {
    console.error(error);
    res.render("../views/products/create", {
      title: "Create Product",
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Show product details
const show = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    const product = await Product.findOne({
      _id: req.params.id,
      branch_id: currentUser.branch_id // Ensure user can only see products from their branch
    })
    .populate('branch_id')
    .populate('created_by', 'name')
    .populate('updated_by', 'name');

    if (!product) {
      req.session.errorMessage = "Product not found or access denied!";
      return res.redirect(res.locals.base + "products");
    }

    res.render("../views/products/show", {
      title: "Product Details",
      product: product,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load product!";
    res.redirect(res.locals.base + "products");
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    const product = await Product.findOne({
      _id: req.params.id,
      branch_id: currentUser.branch_id // Ensure user can only edit products from their branch
    });

    if (!product) {
      req.session.errorMessage = "Product not found or access denied!";
      return res.redirect(res.locals.base + "products");
    }

    res.render("../views/products/edit", {
      title: "Edit Product",
      product: product,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load product!";
    res.redirect(res.locals.base + "products");
  }
};

// Update product
const update = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    const product = await Product.findOne({
      _id: req.params.id,
      branch_id: currentUser.branch_id // Ensure user can only update products from their branch
    });

    if (!product) {
      req.session.errorMessage = "Product not found or access denied!";
      return res.redirect(res.locals.base + "products");
    }

    product.name = req.body.name;
    product.code = req.body.code;
    product.description = req.body.description;
    product.price = parseFloat(req.body.price);
    product.stock = parseInt(req.body.stock);
    product.unit = req.body.unit;
    product.category = req.body.category;
    product.updated_by = currentUser._id;
    product.isActive = req.body.isActive === 'on';

    await product.save();
    req.session.successMessage = "Product updated successfully!";
    res.redirect(res.locals.base + "products");
  } catch (error) {
    console.error(error);
    res.render("../views/products/edit", {
      title: "Edit Product",
      product: product,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Delete product
const destroy = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });
    
    const result = await Product.findOneAndDelete({
      _id: req.params.id,
      branch_id: currentUser.branch_id // Ensure user can only delete products from their branch
    });

    if (!result) {
      req.session.errorMessage = "Product not found or access denied!";
      return res.redirect(res.locals.base + "products");
    }

    req.session.successMessage = "Product deleted successfully!";
    res.redirect(res.locals.base + "products");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete product!";
    res.redirect(res.locals.base + "products");
  }
};

module.exports = {
  index,
  create,
  store,
  show,
  edit,
  update,
  destroy
};