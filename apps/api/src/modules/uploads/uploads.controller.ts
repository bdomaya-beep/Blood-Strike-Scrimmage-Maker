import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  private s3: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: config.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = config.getOrThrow('S3_BUCKET');
  }

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  async signUpload(
    @Body('contentType') contentType: string,
    @Body('fileName') fileName: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const ext = fileName.split('.').pop();
    const key = `uploads/${user.id}/${randomUUID()}.${ext}`;

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 52428800], // 50 MB max
        ['starts-with', '$Content-Type', contentType.split('/')[0]],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 300, // 5 minutes
    });

    return { url, fields, key };
  }
}
