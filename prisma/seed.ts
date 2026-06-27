import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('🌱 Seeding database...');

  // ── Default admin ──
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      nickname: '管理员',
      role: 'admin',
      enabled: true,
    },
  });
  console.log('✅ Admin account: admin / admin123');

  // ── Demo users ──
  const userPassword = await bcrypt.hash('123456', 10);
  const users = [];
  for (const name of ['张三', '李四', '王五', '赵六']) {
    const u = await prisma.user.upsert({
      where: { username: name },
      update: {},
      create: {
        username: name,
        passwordHash: userPassword,
        nickname: name,
        role: 'user',
        enabled: true,
      },
    });
    users.push(u);
  }
  console.log('✅ Demo users: 张三, 李四, 王五, 赵六 (password: 123456)');

  // ── Demo vehicles ──
  const vehicles = [
    {
      title: '2020款 丰田卡罗拉 1.8L CVT精英版',
      plateNumber: '粤A·12345',
      mileage: 52000,
      registrationDate: '2020-03',
      startingPrice: 58000,
      minBidIncrement: 500,
      description: '家用一手车，全程4S店保养，无事故无水泡，车况精品。真皮座椅，倒车影像，自动空调。',
      createdBy: admin.id,
      status: 'available',
    },
    {
      title: '2019款 本田思域 220TURBO CVT燃动版',
      plateNumber: '粤B·67890',
      mileage: 68000,
      registrationDate: '2019-08',
      startingPrice: 65000,
      minBidIncrement: 500,
      description: '原版原漆，定期保养，动力充沛，油耗低。加装行车记录仪、胎压监测。',
      createdBy: admin.id,
      status: 'available',
    },
    {
      title: '2021款 日产轩逸 1.6L XL CVT悦享版',
      plateNumber: '粤C·11111',
      mileage: 35000,
      registrationDate: '2021-06',
      startingPrice: 72000,
      minBidIncrement: 500,
      description: '准新车，仅行驶3.5万公里，内饰几乎全新，百公里油耗6.5L，适合代步通勤。',
      createdBy: admin.id,
      status: 'available',
    },
    {
      title: '2018款 大众帕萨特 330TSI DSG豪华版',
      plateNumber: '粤D·22222',
      mileage: 82000,
      registrationDate: '2018-12',
      startingPrice: 48000,
      minBidIncrement: 300,
      description: '商务轿车，空间宽敞，高速稳定。更换过前保险杠（小刮擦），其他原版。',
      createdBy: admin.id,
      status: 'available',
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.create({ data: v });
  }
  console.log(`✅ ${vehicles.length} demo vehicles created`);

  console.log('\n🎉 Seed complete!');
  console.log('   Admin login: admin / admin123');
  console.log('   User login: 张三 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
