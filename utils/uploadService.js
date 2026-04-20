const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/services");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `service-${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage });

exports.uploadServiceImages = upload.fields([
  { name: "serviceImages", maxCount: 5 },
  { name: "coverImage", maxCount: 1 },
  { name: "categoryCoverImage", maxCount: 1 },
]);
