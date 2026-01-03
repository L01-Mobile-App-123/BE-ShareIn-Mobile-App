import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchFilterDto } from './dto/search.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import type { UserRequest } from '@common/interfaces/userRequest.interface';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { GetPostDto } from '@modules/post/dto/get-post.dto';
import {
  SearchApiResponseDto,
  SearchHistoryApiResponseDto,
  SearchSuggestionsApiResponseDto,
} from './dto/search-response.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get()
  @UseGuards(FirebaseAuthGuard) 
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tìm kiếm bài đăng với bộ lọc nâng cao' })
  @ApiOkResponse({ description: 'Tìm kiếm thành công', type: SearchApiResponseDto })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  @ApiBadRequestResponse({ description: 'Query params không hợp lệ' })
  async search(
    @Query() filters: SearchFilterDto,
    @Req() req: UserRequest,
  ) {
    const userId = req.user?.userId;
    const { data, total } = await this.searchService.search(filters, userId);

    const items = data.map((post) => {
      const dto = new GetPostDto();
      dto.post_id = post.post_id;
      dto.title = post.title;
      dto.description = post.description;
      dto.price = Number(post.price);
      dto.location = post.location;
      dto.is_available = post.is_available;
      dto.status = post.status;
      dto.transaction_type = post.transaction_type;
      dto.view_count = post.view_count;
      dto.like_count = (post as any).like_count ?? 0;
      dto.is_liked = (post as any).is_liked ?? false;
      dto.is_saved = (post as any).is_saved ?? false;
      dto.image_urls = post.image_urls || [];
      dto.created_at = post.created_at;
      dto.user = {
        user_id: post.user?.user_id,
        full_name: post.user?.full_name,
        avatar_url: post.user?.avatar_url,
        reputation_score: post.user?.reputation_score,
      };
      dto.category = post.category
        ? { category_id: post.category.category_id, name: (post.category as any).category_name }
        : null;
      return dto;
    });
    
    return new ApiResponseDto('Tìm kiếm thành công', {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      has_results: total > 0
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Gợi ý từ khóa (Autocomplete)' })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Từ khóa để gợi ý (tìm gần đúng theo title)',
    example: 'giáo',
  })
  @ApiOkResponse({ description: 'Lấy gợi ý thành công', type: SearchSuggestionsApiResponseDto })
  async getSuggestions(@Query('keyword') keyword: string) {
    const suggestions = await this.searchService.getSuggestions(keyword);
    return new ApiResponseDto('Lấy gợi ý thành công', suggestions);
  }

  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử tìm kiếm của người dùng' })
  @ApiOkResponse({ description: 'Lấy lịch sử tìm kiếm thành công', type: SearchHistoryApiResponseDto })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async getHistory(@Req() req: UserRequest) {
    const userId = req.user.userId;
    const history = await this.searchService.getSearchHistory(userId);
    return new ApiResponseDto('Lấy lịch sử tìm kiếm thành công', history);
  }
}
