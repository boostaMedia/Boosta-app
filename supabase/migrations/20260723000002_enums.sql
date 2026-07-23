-- ============================================================================
-- Migration: enums
-- Domain enumerated types. Centralized so every table shares the same values.
-- ============================================================================

create type public.user_role as enum ('admin', 'provider', 'customer');
create type public.user_status as enum ('active', 'suspended', 'pending', 'banned');

create type public.provider_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.document_type as enum ('civil_id', 'commercial_license', 'signature_authorization', 'tax_certificate', 'other');
create type public.document_status as enum ('pending', 'approved', 'rejected');

create type public.billing_interval as enum ('monthly', 'quarterly', 'yearly');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');

create type public.price_type as enum ('fixed', 'starting_from', 'hourly', 'quote');
create type public.service_status as enum ('draft', 'active', 'inactive', 'archived');

create type public.discount_type as enum ('percentage', 'fixed_amount');
create type public.offer_status as enum ('draft', 'scheduled', 'active', 'expired', 'inactive');

create type public.quote_request_status as enum ('open', 'quoted', 'accepted', 'closed', 'cancelled', 'expired');
create type public.provider_quote_status as enum ('submitted', 'accepted', 'rejected', 'withdrawn', 'expired');

create type public.order_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded', 'disputed');

create type public.conversation_status as enum ('open', 'closed', 'archived');

create type public.review_status as enum ('published', 'pending', 'hidden');

create type public.notification_type as enum ('order', 'quote', 'message', 'review', 'payment', 'system', 'promotion');
create type public.notification_channel as enum ('in_app', 'email', 'sms', 'push', 'whatsapp');

create type public.payment_method as enum ('knet', 'visa', 'mastercard', 'apple_pay', 'google_pay', 'wallet', 'cash');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

create type public.transaction_type as enum ('charge', 'refund', 'payout', 'commission', 'wallet_topup', 'wallet_withdrawal');
create type public.transaction_status as enum ('pending', 'completed', 'failed', 'reversed');

create type public.coupon_status as enum ('active', 'inactive', 'expired');
