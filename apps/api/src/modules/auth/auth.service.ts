import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@src/app.types';
import { CreateAccountDto } from '@reviewsup/api/users';
import { EMAIL_FROM } from '@src/modules/email/email.constants';
import { UsersService } from '../users/users.service';
import { ResendEmailService } from '@src/modules/email/resend-email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { render } from '@react-email/render';
import * as React from 'react';
import EmailSigninEmail from '@src/emails/email-signin-email';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private emailService: ResendEmailService,
    private userService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  generateJwt(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async sendMagicLink(email: string, redirect?: string) {
    this.logger.log(`Sending Magic Link: ${email}, Redirect: ${redirect}`);
    let user = await this.prismaService.user.findUnique({
      where: { email },
    });
    let jwtPayload: JwtPayload;
    if (!user) {
      //如果不存在用户email, 则创建一个新的用户， 同时创建 account, provider为 email ，providerAccountId为随机生成的短id
      const dto: CreateAccountDto = {
        email: email,
        name: email.split('@')[0],
        provider: 'email',
        providerAccountId: email,
      };
      jwtPayload = await this.validateOAuthLogin(dto);
    } else {
      //如果用户存在, 则检查是否有对应的 account
      let accountExist = await this.prismaService.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'email',
            providerAccountId: email,
          },
        },
      });
      if (!accountExist) {
        // 如果没有对应的 account, 则创建一个新的 account
        accountExist = await this.createAccount(
          {
            email: email,
            provider: 'email',
            providerAccountId: email,
          },
          user.id,
        );
      }
      jwtPayload = {
        userId: user.id,
        email: user.email,
        provider: accountExist.provider,
        providerAccountId: accountExist.providerAccountId,
      };
    }
    const token = this.generateJwt(jwtPayload);
    const encodedRedirect = encodeURIComponent(redirect);
    const magicLink = `${process.env.NEXT_PUBLIC_API_URL}/auth/magic-login?token=${token}&redirect=${encodedRedirect}`;
    const html = await render(
      React.createElement(EmailSigninEmail, {
        url: magicLink
      }),
    );
    await this.emailService.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `Sign in to Reviewsup.io`,
      html: html,
    });
    return {
      message: 'Magic link sent successfully',
    };
  }

  async validateMagicToken(token: string) {
    const jwtPayload = this.jwtService.verify<JwtPayload>(token);
    if (!jwtPayload || !jwtPayload.userId || !jwtPayload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const dto: CreateAccountDto = {
      email: jwtPayload.email,
      name: jwtPayload.email.split('@')[0],
      provider: 'email',
      providerAccountId: jwtPayload.email,
    };
    return this.validateOAuthLogin(dto);
  }

  async validateOAuthLogin(dto: CreateAccountDto): Promise<JwtPayload> {
    if (!dto || !dto.provider || !dto.providerAccountId || !dto.email) {
      throw new UnauthorizedException('Invalid OAuth user data');
    }
    let userExist = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!userExist) {
      userExist = await this.registerUser(dto);
    }
    let accountExist = await this.prismaService.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: dto.provider,
          providerAccountId: dto.providerAccountId,
        },
      },
    });
    if (!accountExist) {
      accountExist = await this.createAccount(dto, userExist.id);
    }
    return {
      userId: userExist.id,
      email: userExist.email,
      provider: accountExist.provider,
      providerAccountId: accountExist.providerAccountId,
    } as JwtPayload;
  }

  async registerUser(dto: CreateAccountDto) {
    this.logger.debug('registerUser', dto);
    const newUser = await this.prismaService.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await this.userService.addDefaultUserData(newUser);
    await this.notificationsService.onUserCreated(newUser);
    return newUser;
  }

  async createAccount(dto: CreateAccountDto, userId: string) {
    this.logger.debug('createAccount', dto);
    return this.prismaService.account.create({
      data: {
        userId: userId,
        provider: dto.provider,
        providerAccountId: dto.providerAccountId,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresIn: dto.expiresIn,
        tokenType: dto.tokenType,
        scope: dto.scope,
        idToken: dto.idToken,
        sessionState: dto.sessionState,
      },
    });
  }
}
