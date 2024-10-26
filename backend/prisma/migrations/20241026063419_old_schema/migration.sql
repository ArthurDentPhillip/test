-- AlterTable
CREATE SEQUENCE warehousedata_id_seq;
ALTER TABLE "WarehouseData" ALTER COLUMN "id" SET DEFAULT nextval('warehousedata_id_seq');
ALTER SEQUENCE warehousedata_id_seq OWNED BY "WarehouseData"."id";
