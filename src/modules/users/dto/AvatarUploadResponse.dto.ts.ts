import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadResponseDto {
    @ApiProperty({ description: 'Thông báo trạng thái', example: 'Cập nhật avatar thành công' })
    message: string;
    
    @ApiProperty({ description: 'URL ảnh đại diện mới', example: 'https://res.cloudinary.com/yourcloud/image/upload/v1678886400/user_avatars/a1b2c3d4-....webp' })
    avatar_url: string;
}