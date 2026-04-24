-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT,
    "abbreviation" TEXT,
    "drawingNumber" TEXT,
    "variant" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characteristics" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" INTEGER NOT NULL,
    "unit" TEXT,
    "decimals" INTEGER,
    "nominal" DOUBLE PRECISION,
    "target" DOUBLE PRECISION,
    "lowerSpecLimit" DOUBLE PRECISION,
    "upperSpecLimit" DOUBLE PRECISION,
    "toleranceType" INTEGER,
    "group" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_batches" (
    "id" TEXT NOT NULL,
    "characteristicId" TEXT NOT NULL,
    "subgroupSize" INTEGER NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "measurement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "characteristicId" TEXT NOT NULL,
    "batchId" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "operatorId" TEXT,
    "machineId" TEXT,
    "gageId" TEXT,
    "aqdefKFields" JSONB NOT NULL DEFAULT '{}',
    "extensions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentCode" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parts_partNumber_variant_key" ON "parts"("partNumber", "variant");

-- CreateIndex
CREATE UNIQUE INDEX "characteristics_partId_code_key" ON "characteristics"("partId", "code");

-- CreateIndex
CREATE INDEX "measurements_characteristicId_measuredAt_idx" ON "measurements"("characteristicId", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalogs_key_key" ON "catalogs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_catalogId_code_key" ON "catalog_items"("catalogId", "code");

-- AddForeignKey
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_batches" ADD CONSTRAINT "measurement_batches_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "measurement_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
