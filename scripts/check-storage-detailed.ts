#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  try {
    const settings = await prisma.settings.findFirst();
    const storageSettings = settings?.objectStorageSettings as any;

    console.log("Object Storage Settings:");
    console.log("========================");
    console.log("enabled:", storageSettings?.enabled, typeof storageSettings?.enabled);
    console.log("endpoint:", JSON.stringify(storageSettings?.endpoint), "length:", storageSettings?.endpoint?.length);
    console.log("bucket:", JSON.stringify(storageSettings?.bucket));
    console.log("accessKeyId:", JSON.stringify(storageSettings?.accessKeyId));
    console.log("secretAccessKey:", JSON.stringify(storageSettings?.secretAccessKey));
    console.log("region:", JSON.stringify(storageSettings?.region));
    console.log("forcePathStyle:", storageSettings?.forcePathStyle);

    console.log("\nValidation:");
    console.log("enabled?", !!storageSettings?.enabled);
    console.log("has accessKeyId?", !!storageSettings?.accessKeyId);
    console.log("has secretAccessKey?", !!storageSettings?.secretAccessKey);
    console.log("has endpoint?", !!storageSettings?.endpoint);
    console.log("has bucket?", !!storageSettings?.bucket);

    const allValid =
      storageSettings?.enabled &&
      storageSettings?.accessKeyId &&
      storageSettings?.secretAccessKey &&
      storageSettings?.endpoint &&
      storageSettings?.bucket;

    console.log("\nAll valid?", allValid);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
