-- ============================================================================
-- Postgres does not index foreign-key columns automatically. The finance
-- tables carry three FKs that the analytics reads and writes hit directly:
--   * fee_payments.reverses_payment_id   - the reversal-trail lookup (a
--     compensating record references the payment it cancels),
--   * fee_payments.created_by            - who recorded a payment,
--   * expenses.created_by                - who recorded an expense.
-- An unindexed FK turns each of these into a sequential scan of the child
-- table on every row that references it. verify.sql check 7c would flag all
-- three. This migration adds the missing indexes; it changes nothing else.
-- ============================================================================

create index if not exists fee_payments_reverses_idx
  on public.fee_payments (reverses_payment_id);

create index if not exists fee_payments_created_by_idx
  on public.fee_payments (created_by);

create index if not exists expenses_created_by_idx
  on public.expenses (created_by);
