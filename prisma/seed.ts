import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.followedCategory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  const [hiya, muzahid, sayma] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Hiya Rahman",
        email: "hiya@seu.edu.bd",
        passwordHash,
        verified: true,
        bio: "Handmade churi and small gifts."
      }
    }),
    prisma.user.create({
      data: {
        name: "Muzahid Islam",
        email: "muzahid@seu.edu.bd",
        passwordHash,
        verified: true,
        bio: "Electronics buyer and campus deal hunter."
      }
    }),
    prisma.user.create({
      data: {
        name: "Sayma Islam",
        email: "sayma@seu.edu.bd",
        passwordHash,
        verified: true,
        bio: "Used items, makeup, clothing, and general campus goods."
      }
    })
  ]);

  const churi = await prisma.listing.create({
    data: {
      sellerId: hiya.id,
      title: "Handmade churi set",
      description: "Colorful handmade churi set for events and regular campus wear.",
      price: 280,
      category: "Accessories",
      code: "CHURI-2401",
      imageUrl: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80"
    }
  });

  await prisma.listing.createMany({
    data: [
      {
        sellerId: sayma.id,
        title: "Used CSE notes bundle",
        description: "Clean notes for data structure, DBMS, and ISD. Good for quick revision.",
        price: 350,
        category: "Notes",
        code: "NOTE-1732",
        imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80"
      },
      {
        sellerId: sayma.id,
        title: "Lightly used denim jacket",
        description: "Medium size, used only a few times. Can hand over near cafeteria.",
        price: 850,
        category: "Clothing",
        code: "DENM-9082",
        imageUrl: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80"
      },
      {
        sellerId: muzahid.id,
        title: "Scientific calculator",
        description: "Original calculator in good condition, suitable for engineering courses.",
        price: 650,
        category: "Electronics",
        code: "CALC-3155",
        imageUrl: "https://images.unsplash.com/photo-1617566398438-f019f376bda8?auto=format&fit=crop&w=900&q=80"
      },
      {
        sellerId: hiya.id,
        title: "Homemade chocolate cake slice",
        description: "Fresh cake slices available after 1 PM. Pre-order recommended.",
        price: 120,
        category: "Food",
        code: "CAKE-6020",
        imageUrl: "https://images.unsplash.com/photo-1605807646983-377bc5a76493?auto=format&fit=crop&w=900&q=80"
      }
    ]
  });

  const order = await prisma.order.create({
    data: {
      listingId: churi.id,
      buyerId: sayma.id,
      sellerId: hiya.id,
      quantity: 1,
      agreedPrice: 280,
      pickupPoint: "Library lobby",
      status: "COMPLETED",
      paymentStatus: "RECEIVED"
    }
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      buyerId: sayma.id,
      sellerId: hiya.id,
      rating: 5,
      comment: "Nice quality and easy pickup after class."
    }
  });

  await prisma.followedCategory.createMany({
    data: [
      { userId: hiya.id, category: "Notes" },
      { userId: sayma.id, category: "Electronics" }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
