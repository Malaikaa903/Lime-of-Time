const multer = require("multer");
const AppError = require("./appError");
const path = require("path");

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload images only!", 400), false);
  }
};

const createStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `public/img/${folder}`);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}-${Date.now()}${ext}`);
    },
  });
};

exports.uploadUserPhoto = multer({
  storage: createStorage("users"),
  fileFilter: multerFilter,
}).single("profileImage");

exports.uploadBusinessPhoto = multer({
  storage: createStorage("businesses"),
  fileFilter: multerFilter,
}).single("profilePhoto");

exports.uploadBusinessCovers = multer({
  storage: createStorage("businesses"),
  fileFilter: multerFilter,
}).array("coverPhotos", 5);

exports.uploadServiceImages = multer({
  storage: createStorage("services"),
  fileFilter: multerFilter,
}).fields([
  { name: "serviceImages", maxCount: 5 },
  { name: "coverImage", maxCount: 1 },
  { name: "categoryCoverImage", maxCount: 1 },
]);

exports.uploadStaffPhotos = multer({
  storage: createStorage("staff"),
  fileFilter: multerFilter,
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "workPhotos", maxCount: 5 },
]);
