/*
  Warnings:

  - You are about to drop the column `created_at` on the `PollOption` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `PollOption` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PollOption" DROP COLUMN "created_at",
DROP COLUMN "updated_at";
