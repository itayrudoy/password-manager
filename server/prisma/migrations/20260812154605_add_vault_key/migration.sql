-- CreateTable
CREATE TABLE "vault_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "locked_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vault_keys_user_id_key" ON "vault_keys"("user_id");

-- AddForeignKey
ALTER TABLE "vault_keys" ADD CONSTRAINT "vault_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
