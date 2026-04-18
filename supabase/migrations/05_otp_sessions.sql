-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3) WITH TIME ZONE,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
    "last_sent_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_sessions_phone_idx" ON "otp_sessions"("phone");

-- Enable Row Level Security
ALTER TABLE "otp_sessions" ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all otp_sessions
CREATE POLICY "Admins can manage otp_sessions" ON "otp_sessions"
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );
