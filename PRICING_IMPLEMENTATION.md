# StudyHike Pricing Implementation

This document outlines the implementation of the subscription-based pricing structure for StudyHike.

## Overview

StudyHike offers three subscription plans:

1. **Free Plan** (₹0/month)
   - 6-8 auto-scheduled meetings (max 15 min)
   - Email reminders
   - Homework check
   - Progress tracking

2. **Pro Plan** (₹199/month)
   - All Free features
   - 8 mentor meetings (25 min)
   - Test analysis
   - Personalized study resources

3. **Premium Plan** (₹499/month)
   - All Pro features
   - 8 extra on-request meetings (30 min)
   - Custom study plans
   - Priority access

## Implementation Components

### 1. Database Schema

The subscription data is stored in the following tables:

- **students** table (extended with subscription fields):
  - `plan`: The current subscription plan ('free', 'pro', 'premium')
  - `plan_start_date`: When the subscription started
  - `plan_end_date`: When the subscription expires (30 days after start)
  - `meetings_used`: Number of regular meetings used in the current period
  - `on_request_used`: Number of on-request meetings used (Premium plan only)
  - `payment_verified`: Flag to prevent fake activations

- **payments** table (new):
  - Tracks payment history
  - Stores Razorpay payment details
  - Links payments to students

### 2. Database Functions

Several PostgreSQL functions were created to manage subscriptions:

- `update_student_plan`: Updates a student's plan after payment verification
- `has_premium_access`: Checks if a student has access to specific premium features
- `increment_meeting_usage`: Tracks and limits meeting usage based on plan

### 3. API Routes

Two main API routes handle the Razorpay integration:

- `/api/payment/create-order`: Creates a Razorpay order for payment
- `/api/payment/verify-payment`: Verifies payment and updates subscription

### 4. Frontend Components

- **Pricing Page**: Displays plan options and handles payment flow
- **Subscription Card**: Shows subscription status on the dashboard
- **Meeting Request Form**: Enforces meeting limits based on subscription

### 5. Access Control

- Middleware checks subscription status for protected features
- Row-Level Security (RLS) in the database enforces data access rules

## Subscription Flow

1. User views pricing plans on the `/pricing` page
2. User selects a plan and clicks "Join Now"
3. For paid plans, Razorpay checkout opens
4. After successful payment, the backend verifies the payment
5. The student's plan is updated in the database
6. Features are unlocked based on the subscription level

## Feature Access Rules

- **Free Plan**: Access to auto-scheduled meetings only
- **Pro Plan**: Access to mentor meetings, test analysis, resources
- **Premium Plan**: All Pro features plus on-request meetings and custom plans

## Monthly Reset

Subscriptions are valid for 30 days. After expiration:
- Plan is automatically downgraded to 'free'
- Meeting counters are reset when a new subscription is purchased

## Security Measures

- Razorpay signature verification using HMAC SHA256
- Database RLS policies to prevent unauthorized access
- Server-side validation of subscription status

## Testing

To test the subscription system:
1. Create a student account
2. Navigate to the pricing page
3. Select a plan and complete the payment flow
4. Verify that features are accessible based on the plan
5. Check that meeting limits are enforced correctly

## Future Enhancements

- Implement automatic renewals using Razorpay Subscriptions API
- Add email notifications for subscription expiration
- Implement proration for plan upgrades/downgrades
- Add family discounts for multiple students