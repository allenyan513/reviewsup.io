import { Injectable, Logger } from '@nestjs/common';
import {
  CreateShowcaseDto,
  UpdateShowcaseDto,
  ShowcaseConfig,
  ShowcaseEntity,
  VerifyWidgetEmbeddingRequest,
} from '@reviewsup/api/showcases';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginateRequest,
  PaginateResponse,
  RRResponse,
} from '@reviewsup/api/common';
import { Showcase } from '@reviewsup/database/generated/client';
import { generateShortId } from '@src/libs/shortId';
import { ReviewEntity } from '@reviewsup/api/reviews';
import { SortBy } from '@reviewsup/api/common';
import { BrowserlessService } from '@src/modules/browserless/browserless.service';
import * as cheerio from 'cheerio';

@Injectable()
export class ShowcasesService {
  private logger = new Logger('ShowcasesService');
  private defaultConfig: ShowcaseConfig = {
    type: 'flow', // Default type for showcases
    isRatingSummaryEnabled: true,
    isRatingEnabled: true,
    isSourceEnabled: true,
    isDateEnabled: true,
    isImageEnabled: true,
    isVideoEnabled: true,
    isPoweredByEnabled: true,
    sortBy: 'newest',
    count: 20,
    flow: {
      columns: 4,
    },
    breakpoints: {
      sm: 1,
      md: 2,
      lg: 3,
    },
    rows: 1,
    speed: 40,
  };

  constructor(
    private prismaService: PrismaService,
    private browserlessService: BrowserlessService, // Assuming you have a BrowsersService for browserless operations
  ) {}

  async create(uid: string, createShowcaseDto: CreateShowcaseDto) {
    return this.prismaService.showcase.create({
      data: {
        shortId: generateShortId(),
        userId: uid,
        workspaceId: createShowcaseDto.workspaceId,
        name: createShowcaseDto.name,
        config: {
          ...this.defaultConfig, // Merge with any provided config
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(
    uid: string,
    workspaceId: string,
    paginateRequest: PaginateRequest,
  ) {
    this.logger.debug(
      'Fetching showcases for user',
      uid,
      workspaceId,
      paginateRequest,
    );
    if (!uid || !workspaceId || !paginateRequest) {
      throw new Error('Workspace ID is required to fetch reviews');
    }
    const total = await this.prismaService.showcase.count({
      where: {
        userId: uid,
        workspaceId: workspaceId,
      },
    });
    const items = (await this.prismaService.showcase.findMany({
      where: {
        userId: uid,
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date
      },
      skip: (paginateRequest.page - 1) * paginateRequest.pageSize,
      take: paginateRequest.pageSize,
    })) as ShowcaseEntity[];
    return {
      items: items,
      meta: {
        page: paginateRequest.page,
        pageSize: paginateRequest.pageSize,
        total: total,
      },
    } as PaginateResponse<ShowcaseEntity>;
  }

  /**
   * update showcase 可以修改 name 或者 config
   * @param uid
   * @param id
   * @param dto
   */
  async update(uid: string, id: string, dto: UpdateShowcaseDto) {
    this.logger.debug('Updating showcase', id, 'for user', uid, dto);
    return this.prismaService.showcase.update({
      where: {
        id: id,
        userId: uid,
      },
      data: {
        name: dto.name,
        config: dto.config,
        updatedAt: new Date(),
      },
    });
  }

  async remove(uid: string, id: string) {
    return this.prismaService.showcase.delete({
      where: {
        id: id,
        userId: uid,
      },
    });
  }

  async findOneByShortId(shortId: string) {
    this.logger.debug(`Finding showcase by shortId: ${shortId}`);
    const showcase = await this.prismaService.showcase.findFirst({
      where: {
        OR: [
          { shortId: shortId },
          { id: shortId }, // Allow searching by ID as well
        ],
      },
    });
    if (!showcase) {
      throw new Error('Showcase not found');
    }
    return this.findByShowcase(showcase);
  }

  /**
   * showcase 包含一个workspaceId
   * workspaceId 可以关联到全部的reviews, 根据showcase自身的preference来筛选reviews, 需要持久化保存这些preferences, 在对外暴露的API中可以使用
   * @param uid
   * @param id
   */
  async findOne(uid: string, id: string): Promise<ShowcaseEntity> {
    const showcase = await this.prismaService.showcase.findUnique({
      where: {
        id: id,
      },
    });
    if (!showcase || showcase.userId !== uid) {
      throw new Error('Showcase not found or access denied');
    }
    return this.findByShowcase(showcase);
  }

  /**
   *
   * @param showcase
   */
  async findByShowcase(showcase: Showcase): Promise<ShowcaseEntity> {
    const workspaceId = showcase.workspaceId;
    const reviews = await this.prismaService.review.findMany({
      where: {
        workspaceId: workspaceId,
        status: 'public',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        medias: true,
      },
    });
    const config = showcase.config as ShowcaseConfig;
    const { count, sortBy } = config || {};
    // sort first then slice
    let sortedReviews = this.sortReviewsBy(
      reviews as ReviewEntity[],
      sortBy as SortBy,
      count,
    );
    if (count && count > 0) {
      sortedReviews = sortedReviews.slice(0, count);
    }
    return {
      ...showcase,
      reviews: sortedReviews.map(
        (review) =>
          ({
            ...review,
            medias: review.medias || [],
          }) as ReviewEntity,
      ),
    } as ShowcaseEntity;
  }

  sortReviewsBy(reviews: ReviewEntity[], sortBy: SortBy, count?: number) {
    let sortedReviews = [...reviews];
    if (sortBy === SortBy.newest) {
      sortedReviews = [...reviews].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === SortBy.oldest) {
      sortedReviews = [...reviews].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else if (sortBy === SortBy.random) {
      sortedReviews = [...reviews].sort(() => Math.random() - 0.5);
    } else if (sortBy === SortBy.rating) {
      sortedReviews = [...reviews].sort(
        (a, b) => (b.rating || 0) - (a.rating || 0),
      );
    } else {
      sortedReviews = reviews;
    }
    return sortedReviews;
  }

  async verifyWidgetEmbedding(
    uid: string,
    request: VerifyWidgetEmbeddingRequest,
  ): Promise<RRResponse<boolean>> {
    this.logger.debug('Verifying embended widget for showcase', request);
    const { content } = await this.browserlessService.extract(request.url, {
      contentEnable: true,
      faviconEnable: false,
      screenshotEnable: false,
    });
    const $ = cheerio.load(content);
    //查询是否存在 <div id="reviewsup-showcase-1db8f570b48">
    const widgetSelector = `#reviewsup-showcase-${request.showcaseShortId}`;
    const widgetExists = $(widgetSelector).length > 0;
    this.logger.debug(
      `Widget exists for showcase ${request.showcaseShortId}: ${widgetExists}`,
    );
    //查询是否存在 <script id="revewsup-embed-js" type="text/javascript" src="https://reviewsup.com/js/embed.js" defer></script>
    const scriptSelector = `script#revewsup-embed-js[src="${process.env.NEXT_PUBLIC_APP_URL}/js/embed.js"]`;
    const scriptExists = $(scriptSelector).length > 0;
    this.logger.debug(
      `Script exists for showcase ${request.showcaseShortId}: ${scriptExists}`,
    );
    return {
      code: 200,
      message: 'Widget verification successful',
      data: widgetExists && scriptExists,
    } as RRResponse<boolean>;
  }
}
