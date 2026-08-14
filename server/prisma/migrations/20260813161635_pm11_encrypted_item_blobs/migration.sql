/*
  Warnings:

  - You are about to drop the column `notes` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `credentials` table. All the data in the column will be lost.
  - Added the required column `overview_ciphertext` to the `credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secret_ciphertext` to the `credentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "notes",
DROP COLUMN "password",
DROP COLUMN "title",
DROP COLUMN "url",
DROP COLUMN "username",
ADD COLUMN     "overview_ciphertext" TEXT NOT NULL,
ADD COLUMN     "secret_ciphertext" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
