-- Migration: add transfer fields to financial_movements
-- Run this in the Supabase SQL Editor

ALTER TABLE financial_movements
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS transfer_id UUID;

-- Index for fast lookup of paired transfer movements
CREATE INDEX IF NOT EXISTS idx_financial_movements_transfer_id
  ON financial_movements(transfer_id);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_financial_movements_category
  ON financial_movements(category);
