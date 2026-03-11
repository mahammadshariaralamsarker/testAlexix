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
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) return existing;

    const config = getTrustapConfig();
    let trustapUserId: string | null = null;

    try {
      const res = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/api/v1/guest_users`,
          { email: dto.email, name: dto.name, country: dto.country },
          { headers: config.headers },
        ),
      );
      trustapUserId = String(res.data?.id || res.data?.user_id || '');
    } catch (_) {}

    return this.prisma.user.create({
      data: { email: dto.email, name: dto.name, country: dto.country, trustapUserId },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { buyerTransactions: true, sellerTransactions: true },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user;
  }
}
