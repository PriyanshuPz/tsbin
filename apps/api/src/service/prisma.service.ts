import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../_generated/prisma/client';
export type * from '../_generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    super({
      transactionOptions: {
        maxWait: 5000, // default is 2000
        timeout: 10000, // default is 5000
      },
      adapter: new PrismaPg({
        connectionString: configService.get<string>('DATABASE_URL') || '',
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
