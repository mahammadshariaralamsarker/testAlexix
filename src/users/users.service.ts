import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { getTrustapConfig } from '../common/trustap.config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async createUser(dto: CreateUserDto) {
    // Check if user already exists locally
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) return existing;

    const config = getTrustapConfig();

    try {
      // Step 1: Register user on Trustap as guest_user
      const trustapRes = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/api/v1/guest_users`,
          { email: dto.email, name: dto.name, country: dto.country },
          { headers: config.headers },
        ),
      );

      const trustapUserId = trustapRes.data?.id || trustapRes.data?.user_id || null;

      // Step 2: Save user to local DB
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          country: dto.country,
          trustapUserId: String(trustapUserId),
        },
      });

      return user;
    } catch (error) {
      // If Trustap call fails, save locally anyway for sandbox/testing
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          country: dto.country,
        },
      });
      return user;
    }
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        buyerTransactions: true,
        sellerTransactions: true,
      },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user;
  }
}
