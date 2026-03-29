-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "geo_radius_meters" INTEGER NOT NULL DEFAULT 200,
    "address" TEXT,
    "city" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_users" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "earning_mode" TEXT NOT NULL DEFAULT 'visit',
    "points_per_visit" INTEGER NOT NULL DEFAULT 1,
    "points_per_currency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "points_expiration_days" INTEGER,
    "card_bg_color" TEXT NOT NULL DEFAULT '#1a1a2e',
    "card_text_color" TEXT NOT NULL DEFAULT '#ffffff',
    "card_logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_cards" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "current_points" INTEGER NOT NULL DEFAULT 0,
    "total_points_earned" INTEGER NOT NULL DEFAULT 0,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "qr_code_data" TEXT NOT NULL,
    "google_pass_id" TEXT,
    "apple_pass_serial" TEXT,
    "last_visit" TIMESTAMP(3),
    "points_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiers" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_points" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#CD7F32',
    "benefits" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points_required" INTEGER NOT NULL,
    "reward_type" TEXT NOT NULL DEFAULT 'discount',
    "max_redemptions" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "amount_spent" DECIMAL(65,30),
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "redeemed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'push',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_email_key" ON "business_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cards_qr_code_data_key" ON "loyalty_cards"("qr_code_data");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cards_customer_id_program_id_key" ON "loyalty_cards"("customer_id", "program_id");

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiers" ADD CONSTRAINT "tiers_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "loyalty_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "business_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "loyalty_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_redeemed_by_fkey" FOREIGN KEY ("redeemed_by") REFERENCES "business_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
