-- Partial unique indexes to prevent multiple OPEN cash sessions per register or per user
CREATE UNIQUE INDEX IF NOT EXISTS "cash_sessions_open_register_idx"
ON "cash_sessions"("cashRegisterId")
WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX IF NOT EXISTS "cash_sessions_open_user_idx"
ON "cash_sessions"("openedById")
WHERE "status" = 'OPEN';
