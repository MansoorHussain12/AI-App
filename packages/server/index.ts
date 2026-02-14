import app from './src/app';
import { prisma } from './prisma/PrismaClient';
import { config } from './src/config';
import { ensureDataDirectories } from './src/services/ingestion.service';
import { ensureProviderConfig } from './src/services/provider-config.service';
import bcrypt from 'bcryptjs';

async function bootstrap() {
   await ensureDataDirectories();
   const provider = await ensureProviderConfig();
   console.log(
      `[provider] default chat=${provider.defaultLlmProvider} embed=${provider.defaultEmbedProvider} allowRemoteHf=${provider.allowRemoteHf}`
   );
   const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
   const adminPass = process.env.ADMIN_PASSWORD ?? 'admin123';
   const existing = await prisma.user.findUnique({
      where: { username: adminUser },
   });
   if (!existing) {
      await prisma.user.create({
         data: {
            username: adminUser,
            passwordHash: await bcrypt.hash(adminPass, 10),
            role: 'ADMIN',
         },
      });
   }

   app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
   });
}

bootstrap();
