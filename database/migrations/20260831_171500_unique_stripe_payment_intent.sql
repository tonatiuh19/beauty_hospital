-- Prevent duplicate appointments when confirm-payment and the Stripe webhook
-- both fulfill the same PaymentIntent.
ALTER TABLE `payments`
  ADD UNIQUE KEY `unique_stripe_payment_intent_id` (`stripe_payment_intent_id`);
