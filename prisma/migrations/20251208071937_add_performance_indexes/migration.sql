-- CreateIndex
CREATE INDEX "intraday_trades_userId_script_idx" ON "intraday_trades"("userId", "script");

-- CreateIndex
CREATE INDEX "intraday_trades_userId_profitLoss_idx" ON "intraday_trades"("userId", "profitLoss");

-- CreateIndex
CREATE INDEX "intraday_trades_userId_followSetup_idx" ON "intraday_trades"("userId", "followSetup");
