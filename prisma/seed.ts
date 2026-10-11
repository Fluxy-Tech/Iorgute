import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const products = [
  { name: "Iogurte de Morango", flavor: "Morango", size: "500ml", price: 14.9, color: "#E58C98", description: "Iogurte natural com calda artesanal de morango." },
  { name: "Iogurte de Maracujá", flavor: "Maracujá", size: "500ml", price: 14.9, color: "#F2B544", description: "Iogurte natural com polpa de maracujá." },
  { name: "Iogurte Natural", flavor: "Natural", size: "1 litro", price: 19.9, color: "#F3EEE6", description: "Iogurte natural integral, sem açúcar." },
  { name: "Iogurte Natural", flavor: "Natural", size: "500ml", price: 11.9, color: "#F3EEE6", description: "Iogurte natural integral, sem açúcar." },
  { name: "Iogurte de Frutas Vermelhas", flavor: "Frutas vermelhas", size: "500ml", price: 15.9, color: "#B4415A", description: "Amora, framboesa e morango." },
  { name: "Iogurte de Coco", flavor: "Coco", size: "500ml", price: 15.9, color: "#EDE3D1", description: "Iogurte cremoso com coco ralado." },
];

const settings: Record<string, string> = {
  bottleCredit: "2.00",
  deliveryFee: "0.00",
  deliveryDays: "2",
  deliveryCities: "Uberlândia",
  storeName: "Iorgutê",
  storeWhatsapp: "(34) 99999-9999",
};

async function main() {
  if ((await prisma.product.count()) === 0) {
    await prisma.product.createMany({ data: products.map((p) => ({ ...p, stock: 50 })) });
    console.log(`✓ ${products.length} produtos criados`);
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("✓ configurações padrão");
  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: { code: "BEMVINDO10", description: "10% off na primeira compra", type: "PERCENT", value: 10 },
  });
  console.log("✓ cupom BEMVINDO10");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
