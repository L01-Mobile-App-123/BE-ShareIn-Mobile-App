import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchFilterDto } from './dto/search.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import type { UserRequest } from '@common/interfaces/userRequest.interface';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

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
  async search(
    @Query() filters: SearchFilterDto,
    @Req() req: UserRequest,
  ) {
    const userId = req.user?.userId;
    const { data, total } = await this.searchService.search(filters, userId);
    
    return new ApiResponseDto('Tìm kiếm thành công', {
      items: data,
      total,
      page: filters.page,
      limit: filters.limit,
      has_results: total > 0
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Gợi ý từ khóa (Autocomplete)' })
  async getSuggestions(@Query('keyword') keyword: string) {
    const suggestions = await this.searchService.getSuggestions(keyword);
    return new ApiResponseDto('Lấy gợi ý thành công', suggestions);
  }

  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử tìm kiếm của người dùng' })
  async getHistory(@Req() req: UserRequest) {
    const userId = req.user.userId;
    const history = await this.searchService.getSearchHistory(userId);
    return new ApiResponseDto('Lấy lịch sử tìm kiếm thành công', history);
  }
}
