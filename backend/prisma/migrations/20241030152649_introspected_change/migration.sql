/*
  Warnings:

  - The primary key for the `WarehouseData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `WarehouseData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WarehouseData" DROP CONSTRAINT "WarehouseData_pkey",
DROP COLUMN "date",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "WarehouseData_pkey" PRIMARY KEY ("id");
