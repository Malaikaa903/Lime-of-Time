const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const { uploadCategoryImage } = require("../utils/upload");

// categories for dropdown
router.get("/categories", adminController.getAllCategories);

// all admin routes require login + admin role
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

// category management
router.post("/categories", uploadCategoryImage, adminController.createCategory);
router.patch(
  "/categories/:id",
  uploadCategoryImage,
  adminController.updateCategory,
);
router.delete("/categories/:id", adminController.deleteCategory);

// user management
router.get("/users", adminController.getAllUsers);
router.get("/businesses", adminController.getAllBusinessesAdmin);
router.patch("/businesses/:id/pin", adminController.toggleBusinessPin);

module.exports = router;
