# 🍋 Lime of Time — Service Booking Backend

A comprehensive **two-sided service booking platform** backend built with Node.js, Express.js, MongoDB, and Socket.io. Similar to Fresha/Booksy — connecting clients with service businesses.

---

## 📱 About the Project

**Lime of Time** is a full-featured service booking application with two sides:

- **Client Side** — Browse businesses, book services, manage appointments, chat with businesses
- **Business Owner Side** — Manage services, staff, appointments, view statistics, handle payments

---

## ✨ Features

### 🔐 Authentication & Security

- Email + Password authentication with JWT
- OTP verification via email
- Role-based access control (Client / Business Owner / Admin)
- Forgot password & reset via email token
- Account deactivation with OTP confirmation

### 👤 Client Features

- Complete profile with location
- Browse & search businesses (with filters, sorting, pagination)
- View businesses on map (geo-based nearby search)
- Book services with date/time slot selection
- Add-ons selection during booking
- Server-side price calculation (Subtotal + Sales Tax + VAT)
- Multiple payment methods (Cash, Card, PayPal, Google Pay, Apple Pay)
- **Stripe payment integration** (test mode)
- View E-Receipt after booking
- Cancel appointments with reason
- Re-book previous appointments
- Leave reviews & ratings
- Subscribe to business membership plans
- Earn & redeem loyalty points
- Real-time chat with businesses (Socket.io)
- In-app notifications

### 🏢 Business Owner Features

- Single API business profile creation (with subscription plan & first service)
- Business setup with working hours (Mon-Sun)
- Staff management (add, availability, assign services)
- Service management (CRUD, add-ons, discounts)
- Dynamic available slots generation based on business hours
- Accept / Decline / Complete appointments
- Add manual bookings (walk-in clients)
- Business statistics (revenue, staff performance, top services)
- Client database with appointment history
- Transaction history
- Create subscription plans for clients
- Configure loyalty program
- Real-time inbox chat
- Owner platform subscription (Free trial / Premium)

### 👑 Admin Features

- Manage categories (create, update, delete)
- Pin/unpin businesses for featured listings
- View all users and businesses

### 💬 Real-Time Chat

- Socket.io powered real-time messaging
- Typing indicators
- Unread message counts
- Conversation rooms

---

## 🛠️ Tech Stack

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| Node.js      | Runtime environment            |
| Express.js 5 | Web framework                  |
| MongoDB      | Database                       |
| Mongoose     | ODM                            |
| Socket.io    | Real-time communication        |
| JWT          | Authentication                 |
| Bcrypt.js    | Password hashing               |
| Nodemailer   | Email service                  |
| Multer       | File uploads                   |
| Stripe       | Payment processing (test mode) |

---

## 📁 Project Structure

```
lime-of-time-backend/
├── controllers/

│   ├── authController.js

│   ├── userController.js

│   ├── businessController.js

│   ├── staffController.js

│   ├── serviceController.js

│   ├── appointmentController.js

│   ├── reviewController.js

│   ├── transactionController.js

│   ├── subscriptionController.js

│   ├── ownerSubscriptionController.js

│   ├── loyaltyController.js

│   ├── chatController.js

│   ├── notificationController.js

│   ├── adminController.js

│   ├── feedbackController.js

│   └── paymentController.js

├── models/

│   ├── userModel.js

│   ├── businessModel.js

│   ├── staffModel.js

│   ├── serviceModel.js

│   ├── appointmentModel.js

│   ├── reviewModel.js

│   ├── transactionModel.js

│   ├── subscriptionPlanModel.js

│   ├── clientSubscriptionModel.js

│   ├── ownerSubscriptionModel.js

│   ├── loyaltyProgramModel.js

│   ├── loyaltyPointsModel.js

│   ├── conversationModel.js

│   ├── messageModel.js

│   ├── notificationModel.js

│   ├── categoryModel.js

│   └── feedbackModel.js

├── routes/

│   ├── authRoutes.js

│   ├── userRoutes.js

│   ├── businessRoutes.js

│   ├── staffRoutes.js

│   ├── serviceRoutes.js

│   ├── appointmentRoutes.js

│   ├── reviewRoutes.js

│   ├── transactionRoutes.js

│   ├── subscriptionRoutes.js

│   ├── ownerSubscriptionRoutes.js

│   ├── loyaltyRoutes.js

│   ├── chatRoutes.js

│   ├── notificationRoutes.js

│   ├── adminRoutes.js

│   ├── feedbackRoutes.js

│   └── paymentRoutes.js

├── utils/

│   ├── appError.js

│   ├── catchAsync.js

│   ├── globalErrorHandler.js

│   ├── db.js

│   ├── email.js

│   ├── otpGenerate.js

│   └── upload.js

├── dev-data/

│   └── seeder.js

├── public/

│   └── img/

│       ├── users/

│       ├── businesses/

│       ├── services/

│       ├── staff/

│       └── categories/

├── app.js

├── server.js

└── config.env

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Gmail account (for email service)
- Stripe account (for payments)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/lime-of-time-backend.git
cd lime-of-time-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Create `config.env` file in root directory**

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=90d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

**4. Create required folders**

```bash
mkdir -p public/img/users public/img/businesses public/img/services public/img/staff public/img/categories
```

**5. Import seed data (optional)**

```bash
node dev-data/seeder.js --import
```

**6. Start the server**

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 🧪 Test Accounts

After running seed data, use these accounts:

| Role           | Email                 | Password |
| -------------- | --------------------- | -------- |
| Client         | hassan@test.com       | test1234 |
| Client         | sophia@test.com       | test1234 |
| Client         | ali@test.com          | test1234 |
| Business Owner | owner1@test.com       | test1234 |
| Business Owner | owner2@test.com       | test1234 |
| Admin          | admin@limeofttime.com | test1234 |

---

## 📡 API Endpoints

### 🔐 Auth

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| POST   | `/api/auth/signup`                 | Register new user         |
| POST   | `/api/auth/verify-otp`             | Verify email OTP          |
| POST   | `/api/auth/login`                  | Login                     |
| POST   | `/api/auth/logout`                 | Logout                    |
| POST   | `/api/auth/forgot-password`        | Send reset token          |
| PATCH  | `/api/auth/reset-password/:token`  | Reset password            |
| PATCH  | `/api/auth/update-password`        | Update password           |
| POST   | `/api/auth/delete-account/request` | Request account deletion  |
| POST   | `/api/auth/delete-account/confirm` | Confirm deletion with OTP |

### 👤 Users

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| POST   | `/api/users/complete-profile`     | Complete user profile |
| GET    | `/api/users/me`                   | Get my profile        |
| PATCH  | `/api/users/update-me`            | Update profile        |
| PATCH  | `/api/users/toggle-notifications` | Toggle notifications  |

### 🏢 Businesses

| Method | Endpoint                              | Description                          |
| ------ | ------------------------------------- | ------------------------------------ |
| POST   | `/api/businesses/setup`               | Create business profile (single API) |
| GET    | `/api/businesses`                     | Get all businesses (search/filter)   |
| GET    | `/api/businesses/home`                | Home screen data                     |
| GET    | `/api/businesses/nearby`              | Nearby businesses (map)              |
| GET    | `/api/businesses/:id`                 | Get single business                  |
| GET    | `/api/businesses/:id/reviews`         | Get business reviews                 |
| GET    | `/api/businesses/owner/my-business`   | Get my business                      |
| PATCH  | `/api/businesses/owner/update`        | Update my business                   |
| PATCH  | `/api/businesses/owner/toggle-status` | Toggle open/closed                   |
| GET    | `/api/businesses/owner/dashboard`     | Dashboard stats                      |
| GET    | `/api/businesses/owner/statistics`    | Business statistics                  |

### 👨‍💼 Staff

| Method | Endpoint                          | Description                 |
| ------ | --------------------------------- | --------------------------- |
| POST   | `/api/staff`                      | Add staff member            |
| GET    | `/api/staff`                      | Get my staff                |
| GET    | `/api/staff/:id`                  | Get staff profile           |
| PATCH  | `/api/staff/:id`                  | Update staff                |
| PATCH  | `/api/staff/:id/availability`     | Update availability         |
| PATCH  | `/api/staff/:id/assign-services`  | Assign services             |
| DELETE | `/api/staff/:id`                  | Remove staff                |
| GET    | `/api/staff/:id/schedule`         | Get staff schedule          |
| GET    | `/api/staff/business/:businessId` | Get business staff (public) |

### 💇 Services

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| POST   | `/api/services`                      | Create service           |
| GET    | `/api/services`                      | Get my services          |
| GET    | `/api/services/business/:businessId` | Get services by business |
| GET    | `/api/services/:id`                  | Get single service       |
| PATCH  | `/api/services/:id`                  | Update service           |
| DELETE | `/api/services/:id`                  | Remove service           |
| POST   | `/api/services/:id/addons`           | Add add-ons              |
| DELETE | `/api/services/:id/addons/:addOnId`  | Remove add-on            |
| POST   | `/api/services/:id/discount`         | Add discount             |
| DELETE | `/api/services/:id/discount`         | Remove discount          |
| GET    | `/api/services/:id/available-slots`  | Get available time slots |

### 📅 Appointments

| Method | Endpoint                                    | Description            |
| ------ | ------------------------------------------- | ---------------------- |
| GET    | `/api/appointments/summary`                 | Get booking summary    |
| POST   | `/api/appointments/book`                    | Create booking         |
| GET    | `/api/appointments/my-appointments`         | My appointments        |
| GET    | `/api/appointments/:id`                     | Get appointment detail |
| GET    | `/api/appointments/:id/receipt`             | Get E-Receipt          |
| PATCH  | `/api/appointments/:id/cancel`              | Cancel appointment     |
| POST   | `/api/appointments/:id/rebook`              | Re-book appointment    |
| GET    | `/api/appointments/owner/all`               | Owner's appointments   |
| PATCH  | `/api/appointments/owner/:id/accept`        | Accept appointment     |
| PATCH  | `/api/appointments/owner/:id/decline`       | Decline appointment    |
| PATCH  | `/api/appointments/owner/:id/complete`      | Mark as complete       |
| PATCH  | `/api/appointments/owner/:id/cancel`        | Cancel by owner        |
| POST   | `/api/appointments/owner/manual-booking`    | Add manual booking     |
| GET    | `/api/appointments/owner/clients`           | Client database        |
| GET    | `/api/appointments/owner/clients/:clientId` | Client detail          |

### ⭐ Reviews

| Method | Endpoint                            | Description      |
| ------ | ----------------------------------- | ---------------- |
| POST   | `/api/reviews`                      | Add review       |
| GET    | `/api/reviews/my-reviews`           | My reviews       |
| PATCH  | `/api/reviews/:id`                  | Update review    |
| DELETE | `/api/reviews/:id`                  | Delete review    |
| GET    | `/api/reviews/business/:businessId` | Business reviews |
| GET    | `/api/reviews/service/:serviceId`   | Service reviews  |
| GET    | `/api/reviews/staff/:staffId`       | Staff reviews    |

### 💳 Payments (Stripe)

| Method | Endpoint                                | Description           |
| ------ | --------------------------------------- | --------------------- |
| POST   | `/api/payments/create-intent`           | Create payment intent |
| POST   | `/api/payments/confirm`                 | Confirm payment       |
| POST   | `/api/payments/refund`                  | Refund payment        |
| GET    | `/api/payments/status/:paymentIntentId` | Check payment status  |

### 💰 Transactions

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/api/transactions/my-transactions` | Client transactions       |
| GET    | `/api/transactions/:id`             | Single transaction        |
| GET    | `/api/transactions/owner/history`   | Owner transaction history |

### 📋 Subscriptions

| Method | Endpoint                                                    | Description          |
| ------ | ----------------------------------------------------------- | -------------------- |
| GET    | `/api/subscriptions/plans/business/:businessId`             | Business plans       |
| POST   | `/api/subscriptions/subscribe`                              | Subscribe to plan    |
| GET    | `/api/subscriptions/my-subscriptions`                       | My subscriptions     |
| GET    | `/api/subscriptions/my-subscriptions/:id`                   | Subscription detail  |
| PATCH  | `/api/subscriptions/my-subscriptions/:id/toggle-auto-renew` | Toggle auto-renew    |
| PATCH  | `/api/subscriptions/my-subscriptions/:id/cancel`            | Cancel subscription  |
| POST   | `/api/subscriptions/plans`                                  | Create plan (owner)  |
| GET    | `/api/subscriptions/plans`                                  | Get my plans (owner) |
| PATCH  | `/api/subscriptions/plans/:id`                              | Update plan          |
| DELETE | `/api/subscriptions/plans/:id`                              | Delete plan          |
| GET    | `/api/subscriptions/subscribers`                            | Get subscribers      |

### 🎁 Loyalty

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/api/loyalty/configure`   | Configure program (owner)  |
| GET    | `/api/loyalty/my-programs` | Get my programs (owner)    |
| PATCH  | `/api/loyalty/toggle/:id`  | Toggle program             |
| GET    | `/api/loyalty/my-points`   | My loyalty points (client) |
| POST   | `/api/loyalty/claim`       | Claim reward               |

### 💬 Chat

| Method | Endpoint                               | Description                    |
| ------ | -------------------------------------- | ------------------------------ |
| POST   | `/api/chat/conversations`              | Start conversation             |
| GET    | `/api/chat/conversations/my`           | My conversations (client)      |
| GET    | `/api/chat/conversations/business`     | Business conversations (owner) |
| GET    | `/api/chat/conversations/:id/messages` | Get messages                   |
| POST   | `/api/chat/conversations/:id/messages` | Send message                   |

### 🔔 Notifications

| Method | Endpoint                           | Description          |
| ------ | ---------------------------------- | -------------------- |
| GET    | `/api/notifications`               | Get my notifications |
| PATCH  | `/api/notifications/mark-all-read` | Mark all as read     |
| DELETE | `/api/notifications/delete-all`    | Delete all           |
| PATCH  | `/api/notifications/:id/read`      | Mark as read         |
| DELETE | `/api/notifications/:id`           | Delete notification  |

### 👑 Admin

| Method | Endpoint                        | Description                 |
| ------ | ------------------------------- | --------------------------- |
| GET    | `/api/admin/categories`         | Get all categories (public) |
| POST   | `/api/admin/categories`         | Create category             |
| PATCH  | `/api/admin/categories/:id`     | Update category             |
| DELETE | `/api/admin/categories/:id`     | Delete category             |
| GET    | `/api/admin/users`              | Get all users               |
| GET    | `/api/admin/businesses`         | Get all businesses          |
| PATCH  | `/api/admin/businesses/:id/pin` | Toggle business pin         |

---

## 🔌 Socket.io Events

### Client → Server

| Event                | Data                         | Description         |
| -------------------- | ---------------------------- | ------------------- |
| `user_online`        | `userId`                     | User connected      |
| `join_conversation`  | `conversationId`             | Join chat room      |
| `leave_conversation` | `conversationId`             | Leave chat room     |
| `typing`             | `{ conversationId, userId }` | User is typing      |
| `stop_typing`        | `{ conversationId, userId }` | User stopped typing |

### Server → Client

| Event                  | Data                              | Description                   |
| ---------------------- | --------------------------------- | ----------------------------- |
| `new_message`          | `{ message, conversationId }`     | New message received          |
| `message_sent`         | `{ message, conversationId }`     | Message delivery confirmation |
| `user_typing`          | `{ userId, conversationId }`      | Other user is typing          |
| `user_stop_typing`     | `{ userId, conversationId }`      | Other user stopped typing     |
| `conversation_updated` | `{ conversationId, lastMessage }` | Conversation updated          |

---

## 💡 Key Design Decisions

### Server-Side Price Calculation

All pricing is calculated on the backend — subtotal, sales tax (7%), VAT (17%). Frontend prices are never trusted.

### Available Slots Generation

Slots are dynamically generated based on:

1. Business working hours
2. Service duration + break time
3. Already booked slots removed
4. Staff availability filtered within business hours

### Mock Payment System

For local market (Pakistan), Stripe test mode is used. Production would integrate JazzCash/EasyPaisa.

### Real-Time Chat Architecture

REST API saves messages to database → Socket.io delivers them instantly to conversation room members.

---

## 🌱 Seed Data Commands

```bash
# Import all test data
node dev-data/seeder.js --import

# Delete all data
node dev-data/seeder.js --delete
```

---

## 👩‍💻 Developer

**Malaika Tabassum**
BS Software Engineering — University of Gujrat

---

## 📄 License

This project is for educational purposes.
