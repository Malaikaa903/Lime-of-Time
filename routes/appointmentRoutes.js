const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.get(
  "/summary",
  authController.restrictTo("client"),
  appointmentController.getBookingSummary,
);

router.post(
  "/book",
  authController.restrictTo("client"),
  appointmentController.createBooking,
);

router.get(
  "/my-appointments",
  authController.restrictTo("client"),
  appointmentController.getMyAppointments,
);

router.get(
  "/owner/all",
  authController.restrictTo("business_owner"),
  appointmentController.getOwnerAppointments,
);

router.post(
  "/owner/manual-booking",
  authController.restrictTo("business_owner"),
  appointmentController.addManualBooking,
);

router.get(
  "/owner/clients",
  authController.restrictTo("business_owner"),
  appointmentController.getClientDatabase,
);

router.get(
  "/owner/clients/:clientId",
  authController.restrictTo("business_owner"),
  appointmentController.getClientDetail,
);

router.patch(
  "/owner/:id/accept",
  authController.restrictTo("business_owner"),
  appointmentController.acceptAppointment,
);

router.patch(
  "/owner/:id/decline",
  authController.restrictTo("business_owner"),
  appointmentController.declineAppointment,
);

router.patch(
  "/owner/:id/complete",
  authController.restrictTo("business_owner"),
  appointmentController.markComplete,
);

router.patch(
  "/owner/:id/cancel",
  authController.restrictTo("business_owner"),
  appointmentController.cancelByOwner,
);

router.get("/:id", appointmentController.getAppointmentById);
router.get("/:id/receipt", appointmentController.getEReceipt);

router.patch(
  "/:id/cancel",
  authController.restrictTo("client"),
  appointmentController.cancelAppointment,
);

router.post(
  "/:id/rebook",
  authController.restrictTo("client"),
  appointmentController.reBook,
);

module.exports = router;
