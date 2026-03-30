-- AlterTable
ALTER TABLE "loyalty_cards" ALTER COLUMN "current_points" SET DEFAULT 0,
ALTER COLUMN "current_points" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_points_earned" SET DEFAULT 0,
ALTER COLUMN "total_points_earned" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "reward_redemptions" ALTER COLUMN "points_spent" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;
