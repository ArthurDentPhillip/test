-- CreateTable
CREATE TABLE "WarehouseData" (
    "id" INTEGER NOT NULL,
    "boxDeliveryAndStorageExpr" TEXT NOT NULL,
    "boxDeliveryBase" TEXT NOT NULL,
    "boxDeliveryLiter" TEXT NOT NULL,
    "boxStorageBase" TEXT NOT NULL,
    "boxStorageLiter" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,

    CONSTRAINT "WarehouseData_pkey" PRIMARY KEY ("id")
);
