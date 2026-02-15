// Server-side Cloudinary utilities
// Note: This file should only be imported in server components or API routes

import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary for server-side use
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

// Server-side Cloudinary service
export class ServerCloudinaryService {
  /**
   * Upload an image to Cloudinary
   */
  static async uploadImage(
    file: Buffer | string,
    options?: {
      folder?: string
      public_id?: string
      transformation?: any[]
      overwrite?: boolean
      resource_type?: 'image' | 'raw' | 'video'
      contentType?: string
    }
  ) {
    try {
      const asString = typeof file === 'string'
        ? file
        : `data:${options?.contentType || 'application/octet-stream'};base64,${file.toString('base64')}`

      const result = await cloudinary.uploader.upload(asString, {
        folder: options?.folder || 'my-project',
        public_id: options?.public_id,
        transformation: options?.transformation,
        overwrite: options?.overwrite ?? true,
        resource_type: options?.resource_type || 'image',
      })
      
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Upload a PDF (or any raw file) to Cloudinary under the `courses` folder by default
   */
  static async uploadPdf(
    file: Buffer | string,
    options?: {
      folder?: string
      public_id?: string
      overwrite?: boolean
    }
  ) {
    return this.uploadImage(file, {
      folder: options?.folder || 'courses',
      public_id: options?.public_id,
      overwrite: options?.overwrite ?? true,
      resource_type: 'raw',
      contentType: 'application/pdf',
    })
  }

  /**
   * Upload an image from a URL
   */
  static async uploadImageFromUrl(
    url: string,
    options?: {
      folder?: string
      public_id?: string
      transformation?: any[]
      overwrite?: boolean
    }
  ) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options?.folder || 'my-project',
        public_id: options?.public_id,
        transformation: options?.transformation,
        overwrite: options?.overwrite ?? true,
      })
      
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary URL upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'URL upload failed',
      }
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * Delete any resource by specifying the resource type (image, video, raw)
   */
  static async deleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
      return { success: true, data: result }
    } catch (error) {
      console.error('Cloudinary delete resource error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete resource failed',
      }
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteImages(publicIds: string[]) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary bulk delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk delete failed',
      }
    }
  }

  /**
   * Get image metadata
   */
  static async getImageInfo(publicId: string) {
    try {
      // Try raw resources first (our course PDFs are uploaded as raw)
      let result: any
      try {
        result = await cloudinary.api.resource(publicId, { resource_type: 'raw' })
      } catch (e) {
        // Fallback to image resource type to aid debugging if mis-uploaded
        result = await cloudinary.api.resource(publicId, { resource_type: 'image' })
      }
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary info error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get info',
      }
    }
  }

  /**
   * List images in a folder
   */
  static async listImages(folder: string, options?: {
    max_results?: number
    next_cursor?: string
    prefix?: string
  }) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: folder,
        max_results: options?.max_results || 50,
        next_cursor: options?.next_cursor,
      })
      
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Cloudinary list error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list images',
      }
    }
  }

  /**
   * Generate a signed URL for private images
   */
  static getSignedUrl(
    publicId: string,
    options?: {
      width?: number
      height?: number
      crop?: string
      quality?: number
      format?: string
      expires_at?: number // Unix timestamp
    }
  ) {
    try {
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'private',
        ...options,
      })
      
      return {
        success: true,
        data: { url },
      }
    } catch (error) {
      console.error('Cloudinary signed URL error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL',
      }
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  }

  /**
   * Get Cloudinary configuration status
   */
  static getConfigStatus() {
    return {
      configured: this.isConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    }
  }
}

// Helper functions for common server operations
export const CloudinaryHelpers = {
  /**
   * Upload user avatar with standard transformations
   */
  uploadAvatar: async (file: Buffer | string, userId?: string) => {
    const publicId = userId ? `avatars/user_${userId}` : undefined
    return ServerCloudinaryService.uploadImage(file, {
      folder: 'avatars',
      public_id: publicId,
      transformation: [
        { width: 150, height: 150, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { format: 'auto' },
      ],
    })
  },

  /**
   * Upload article cover with standard transformations
   */
  uploadCover: async (file: Buffer | string, articleId?: string) => {
    const publicId = articleId ? `covers/article_${articleId}` : undefined
    return ServerCloudinaryService.uploadImage(file, {
      folder: 'covers',
      public_id: publicId,
      transformation: [
        { width: 800, height: 400, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' },
        { format: 'auto' },
      ],
    })
  },

  /**
   * Upload general image with thumbnail generation
   */
  uploadWithThumbnail: async (file: Buffer | string, options?: {
    folder?: string
    public_id?: string
  }) => {
    return ServerCloudinaryService.uploadImage(file, {
      folder: options?.folder || 'uploads',
      public_id: options?.public_id,
      transformation: [
        { width: 800, height: 600, crop: 'limit', quality: 'auto', format: 'auto' },
      ],
    })
  },

  /**
   * Delete user-related images
   */
  deleteUserImages: async (userId: string) => {
    const avatarPublicId = `avatars/user_${userId}`
    return ServerCloudinaryService.deleteImage(avatarPublicId)
  },

  /**
   * Delete article-related images
   */
  deleteArticleImages: async (articleId: string) => {
    const coverPublicId = `covers/article_${articleId}`
    return ServerCloudinaryService.deleteImage(coverPublicId)
  },
}