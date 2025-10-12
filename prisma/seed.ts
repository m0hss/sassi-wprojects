import prisma from "../lib/prisma";

async function main() {
  const brand1 = await prisma.brand.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "قوالب",
    },
  });
  const brand2 = await prisma.brand.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "إضافات",
    },
  });

  const product1 = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: ({
      slug: "yallashoot",
      name: "قالب يلاشوت YallaShoot",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 5000,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/shootkoora",
    } as any),
  });

  const product2 = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: ({
      slug: "M0dev",
      name: "تصميم وتطوير المواقع الإلكترونية",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 2999,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/m0news",
    } as any),
  });

  const product3 = await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: ({
      slug: "maxkoor",
      name: "قالب ماكس كورة MaxKoora",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 45000,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/M0wiki",
    } as any),
  });

  const product4 = await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: ({
      slug: "AlphaFlash",
      name: "قالب ألفا فلاش AlphaFlash ",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 1,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/maxkoora",
    } as any),
  });

  const product5 = await prisma.product.upsert({
    where: { id: 5 },
    update: {},
    create: ({
      slug: "M0sport",
      name: " السحب التلقائي لجدول المباريات M0SportAPI",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 50000,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/shootkooraV2",
    } as any),
  });

  const product6 = await prisma.product.upsert({
    where: { id: 6 },
    update: {},
    create: ({
      slug: "shootkoora",
      name: "قالب شوت كورة ShootKoora ",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 30000,
      currency: "usd",
      brandId: 2,
      url: "https://example.com/demos/M0sportAPI",
    } as any),
  });

  const product7 = await prisma.product.upsert({
    where: { id: 7 },
    update: {},
    create: ({
      slug: "M0plyr",
      name: "M0plyr مشغل ملفات البث المباشر",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price: 45000,
      currency: "usd",
      brandId: 1,
      url: "https://example.com/demos/shootkooraV3",
    } as any),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
