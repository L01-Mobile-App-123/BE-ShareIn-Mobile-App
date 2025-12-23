import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { User } from '@modules/entities/user.entity';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary) {}

  async uploadAvatarAndReplace(file: Express.Multer.File, user: User): Promise<string> {
    if (!file) {
      throw new BadRequestException('Vui lòng cung cấp file ảnh.');
    }
    
    // Tên thư mục trong Cloudinary
    const FOLDER_NAME = 'user_avatars';
    // Public ID duy nhất, dựa trên user_id, đảm bảo ghi đè (overwrite)
    const publicId = `${FOLDER_NAME}/${user.user_id}`;
    // Tải lên ảnh mới
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      this.cloudinary.uploader.upload_stream({
        folder: FOLDER_NAME,
        public_id: user.user_id,
        overwrite: true,
        resource_type: 'auto',
        format: 'webp', // Tùy chọn: Chuyển đổi sang định dạng tối ưu
      }, (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result);
      }).end(file.buffer);
    });
    
    return result.secure_url; // Trả về URL an toàn
  }

  async uploadMultipleFiles(targetId: string, files: Express.Multer.File[], folderPrefix = 'post_images'): Promise<string[]> {
    if (!files || files.length === 0) {
        throw new BadRequestException('Vui lòng cung cấp ít nhất một file ảnh.');
    }

    const FOLDER_NAME = `${folderPrefix}/${targetId}`;
    const uploadPromises = files.map(file => {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        this.cloudinary.uploader.upload_stream({
          folder: FOLDER_NAME,
          resource_type: 'auto',
          format: 'webp',
        }, (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result);
        }).end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  }
}