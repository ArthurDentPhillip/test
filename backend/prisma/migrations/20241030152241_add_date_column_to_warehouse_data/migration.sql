/*
  Warnings:

  - The primary key for the `WarehouseData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `WarehouseData` table. All the data in the column will be lost.
  - Added the required column `date` to the `WarehouseData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WarehouseData" DROP CONSTRAINT "WarehouseData_pkey",
DROP COLUMN "id",
ADD COLUMN     "date" TEXT NOT NULL,
ADD CONSTRAINT "WarehouseData_pkey" PRIMARY KEY ("warehouseName", "date");
