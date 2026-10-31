import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding BahiVerse AI database...');

  // Create demo business
  const business = await prisma.business.upsert({
    where: { id: 'demo-business-001' },
    update: {},
    create: {
      id: 'demo-business-001',
      name: 'Sharma General Store',
      gstin: '09AAACH7409R1ZZ',
      address: '12, Market Road, Chandni Chowk, Delhi - 110006',
      phone: '+91 98765 43210',
      email: 'sharma.store@example.com',
      language: 'hi',
      currency: 'INR',
    },
  });

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@bahiverse.ai' },
    update: {},
    create: {
      id: 'demo-user-001',
      name: 'Ramesh Sharma',
      email: 'demo@bahiverse.ai',
      passwordHash: hashPassword('Demo@1234'),
      role: 'owner',
      businessId: business.id,
    },
  });

  // Sample vocabulary
  const vocabItems = [
    { rawTerm: 'doodh', normalizedTerm: 'milk', category: 'product', language: 'hi' },
    { rawTerm: 'aata', normalizedTerm: 'wheat flour', category: 'product', language: 'hi' },
    { rawTerm: 'chawal', normalizedTerm: 'rice', category: 'product', language: 'hi' },
    { rawTerm: 'tel', normalizedTerm: 'oil', category: 'product', language: 'hi' },
    { rawTerm: 'namak', normalizedTerm: 'salt', category: 'product', language: 'hi' },
    { rawTerm: 'paani', normalizedTerm: 'water', category: 'product', language: 'hi' },
    { rawTerm: 'sabzi', normalizedTerm: 'vegetables', category: 'product', language: 'hi' },
    { rawTerm: 'kg', normalizedTerm: 'kilogram', category: 'unit', language: 'en' },
    { rawTerm: 'ltr', normalizedTerm: 'litre', category: 'unit', language: 'en' },
    { rawTerm: 'pcs', normalizedTerm: 'pieces', category: 'unit', language: 'en' },
  ];

  for (const item of vocabItems) {
    await prisma.vocabularyMapping.upsert({
      where: { businessId_rawTerm: { businessId: business.id, rawTerm: item.rawTerm } },
      update: {},
      create: { ...item, businessId: business.id },
    });
  }

  // Sample products
  const products = [
    { name: 'Amul Milk 1L', unit: 'litre', defaultPrice: 68, category: 'Dairy' },
    { name: 'Atta 10kg', unit: 'kg', defaultPrice: 350, category: 'Grains' },
    { name: 'Basmati Rice 5kg', unit: 'kg', defaultPrice: 450, category: 'Grains' },
    { name: 'Fortune Sunflower Oil 1L', unit: 'litre', defaultPrice: 145, category: 'Oil' },
    { name: 'Tata Salt 1kg', unit: 'kg', defaultPrice: 24, category: 'Spices' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { businessId: business.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: { ...p, businessId: business.id },
      });
    }
  }

  // Sample customer
  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer-001' },
    update: {},
    create: {
      id: 'demo-customer-001',
      businessId: business.id,
      name: 'Suresh Kumar',
      phone: '+91 99887 76655',
      address: 'House 5, Gali No. 3, Karol Bagh, Delhi',
    },
  });

  // Sample demo bill
  const existingBill = await prisma.bill.findFirst({ where: { id: 'demo-bill-001' } });
  if (!existingBill) {
    const bill = await prisma.bill.create({
      data: {
        id: 'demo-bill-001',
        businessId: business.id,
        userId: user.id,
        customerId: customer.id,
        captureMode: 'upload',
        billDate: '2024-10-30',
        vendorName: 'Sharma General Store',
        subtotal: 987.0,
        taxAmount: 49.35,
        totalAmount: 1036.35,
        status: 'reviewed',
        confidence: 0.89,
        language: 'hi',
        rawText: '[DEMO] Sample handwritten bill OCR output',
      },
    });

    await prisma.billItem.createMany({
      data: [
        { billId: bill.id, rawDescription: 'Amul Milk 1L x6', normalizedName: 'Amul Milk 1L', quantity: 6, unit: 'litre', unitPrice: 68, totalPrice: 408, confidence: 0.95 },
        { billId: bill.id, rawDescription: 'Atta 10kg', normalizedName: 'Atta 10kg', quantity: 1, unit: 'kg', unitPrice: 350, totalPrice: 350, confidence: 0.88 },
        { billId: bill.id, rawDescription: 'Fortune Oil 1L', normalizedName: 'Fortune Sunflower Oil 1L', quantity: 1, unit: 'litre', unitPrice: 145, totalPrice: 145, confidence: 0.82 },
        { billId: bill.id, rawDescription: 'Tata Salt', normalizedName: 'Tata Salt 1kg', quantity: 2, unit: 'kg', unitPrice: 24, totalPrice: 48, confidence: 0.92 },
      ],
    });
  }

  console.log('✅ Seed complete!');
  console.log('📧 Demo login: demo@bahiverse.ai');
  console.log('🔑 Demo password: Demo@1234');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
