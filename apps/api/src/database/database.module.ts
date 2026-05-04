import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prismaProvider = {
  provide: PrismaClient,
  useFactory: () => {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
    return prisma;
  },
};

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PrismaClient],
})
export class DatabaseModule {}
