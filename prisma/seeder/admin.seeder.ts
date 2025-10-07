import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Inisialisasi PrismaClient
const prisma = new PrismaClient();

export async function seedAdmin() {
  console.log('⏳ Seeding admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'yons@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Yonstrans123'; // Ganti dengan password kuat di produksi!
  const adminUsername = process.env.ADMIN_USERNAME || 'YonstransAdmin';
  const adminNamaLengkap = process.env.ADMIN_NAMA_LENGKAP || 'Administrator Sistem';
  const adminRole = process.env.ADMIN_ROLE === 'super_admin' ? 'super_admin' : 'admin';

  try {
    // Cek apakah admin sudah ada
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ email: adminEmail }, { username: adminUsername }],
      },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user with email ${adminEmail} or username ${adminUsername} already exists. Skipping.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        namaLengkap: adminNamaLengkap,
        role: adminRole,
        statusAktif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✨ Admin "${newAdmin.username}" (${newAdmin.email}) created successfully with role: ${newAdmin.role}`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

