-- AlterTable
ALTER TABLE "product_image" DROP COLUMN "data",
ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_image_key_key" ON "product_image"("key");

