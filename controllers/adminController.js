const Category = require("../models/categoryModel");
const User = require("../models/userModel");
const Business = require("../models/businessModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// create category (admin)
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new AppError("Category name is required", 400));
  }

  // check duplicate
  const existing = await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });

  if (existing) {
    return next(new AppError(`Category "${name}" already exists`, 400));
  }

  const category = await Category.create({
    name,
    image: req.file ? req.file.filename : null,
    createdBy: "admin",
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Category created successfully",
    data: { category },
  });
});

// get all categories (public)
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({ isActive: true }).sort("name");

  res.status(200).json({
    success: true,
    status: 200,
    results: categories.length,
    data: { categories },
  });
});

// update category (admin)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, image: req.file ? req.file.filename : undefined },
    { new: true, runValidators: true },
  );

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Category updated",
    data: { category },
  });
});

// delete category (admin)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  category.isActive = false;
  await category.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Category deleted",
  });
});

// get all users (admin)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { role, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    status: 200,
    total,
    data: { users },
  });
});

// get all businesses (admin)
exports.getAllBusinessesAdmin = catchAsync(async (req, res, next) => {
  const businesses = await Business.find()
    .populate("owner", "firstName lastName email")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: businesses.length,
    data: { businesses },
  });
});

// toggle business isPinned (admin)
exports.toggleBusinessPin = catchAsync(async (req, res, next) => {
  const business = await Business.findById(req.params.id);

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  business.isPinned = !business.isPinned;
  await business.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: `Business ${business.isPinned ? "pinned " : "unpinned"} successfully`,
    data: { isPinned: business.isPinned },
  });
});
