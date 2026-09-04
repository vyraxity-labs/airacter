/*
  Warnings:

  - Changed the type of `provider` on the `PaymentTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currency` on the `PaymentTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `purpose` on the `PaymentTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `PaymentTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `key` on the `Plan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `priceNgnKobo` on table `Plan` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PlanKey" AS ENUM ('lite', 'standard', 'pro');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('paystack', 'stripe');

-- CreateEnum
CREATE TYPE "PaymentCurrency" AS ENUM ('NGN', 'USD');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('subscription', 'topup', 'character_payment', 'creator_payout');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'success', 'failed');

-- AlterTable
ALTER TABLE "PaymentTransaction" DROP COLUMN "provider",
ADD COLUMN     "provider" "PaymentProvider" NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "PaymentCurrency" NOT NULL,
DROP COLUMN "purpose",
ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "key",
ADD COLUMN     "key" "PlanKey" NOT NULL,
ALTER COLUMN "priceNgnKobo" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");
