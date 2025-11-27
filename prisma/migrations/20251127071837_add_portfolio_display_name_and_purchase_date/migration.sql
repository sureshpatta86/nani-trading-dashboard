-- AlterTable
ALTER TABLE "portfolio_stocks" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
