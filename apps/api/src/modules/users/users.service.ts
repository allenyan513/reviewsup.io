import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserEntity } from '@reviewsup/api/users';
import { generateShortId } from '@src/libs/shortId';
import { FormsService } from '../forms/forms.service';
import { ShowcasesService } from '../showcases/showcases.service';
import { defaultUserData } from './default-data';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prismaService: PrismaService,
    private formService: FormsService,
    private showcasesService: ShowcasesService,
  ) {}

  async getProfile(userId: string): Promise<UserEntity> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        balance: true,
        avatarUrl: true,
        subscriptionTier: true,
        Workspace: {
          select: {
            id: true,
            name: true,
            shortId: true,
          },
        },
      },
    });
    return user;
  }

  async getUserByUid(uid: string) {
    this.logger.debug(`Fetching user by UID: ${uid}`);
    const user = await this.prismaService.user.findUnique({
      where: { id: uid },
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async findOneBySlug(slug: string) {
    this.logger.debug(`Fetching user by Slug: ${slug}`);
    return this.prismaService.user.findUnique({
      where: { id: slug },
      include: {
        Workspace: true,
        reviewerReviews: true,
        ownerReviews: true,
      },
    });
  }

  /**
   * 当新用户创建时调用
   * 创建一个默认的workspace
   * workspace下创建一个默认的form
   * form下创建一个默认的review
   * form下创建一个默认的widget
   */
  async addDefaultUserData(user: UserEntity) {
    if (!user) {
      throw new Error('User is required to create default workspace and form');
    }
    const defaultWorkspace = await this.prismaService.workspace.create({
      data: {
        shortId: generateShortId(),
        name: defaultUserData.workspace,
        userId: user.id,
      },
    });
    if (!defaultWorkspace) {
      throw new Error('Unable to create default workspace');
    }
    const defaultForm = await this.formService.create(user.id, {
      name: defaultUserData.form,
      workspaceId: defaultWorkspace.id,
    });
    if (!defaultForm) {
      throw new Error('Unable to create default workspace');
    }
    for (const review of defaultUserData.reviews) {
      await this.prismaService.review.create({
        data: {
          workspaceId: defaultWorkspace.id,
          formId: defaultForm.id,
          reviewerName: review.reviewerName,
          reviewerImage: review.reviewerImage,
          reviewerTitle: review.reviewerTitle,
          rating: review.rating,
          text: review.text,
          status: review.status,
        },
      });
    }
    const defaultShowcase = await this.showcasesService.create(user.id, {
      workspaceId: defaultWorkspace.id,
      name: defaultUserData.showcase,
    });
    if (!defaultShowcase) {
      throw new Error('Unable to create default showcase');
    }
  }

  async deleteUser(userId: string) {
    this.logger.debug(`Deleting user with ID: ${userId}`);
    if (!userId) {
      throw new Error('User ID is required to delete user');
    }
    return this.prismaService.user.delete({
      where: { id: userId },
    });
  }
}
