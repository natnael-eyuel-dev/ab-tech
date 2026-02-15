// Client-side Cloudinary utilities
// Note: This file should only be used on the client side

// Cloudinary URL builder for client-side use
export class CloudinaryService {
  private static cloudName: string
  private static initialized = false

  static init(cloudName: string) {
    this.cloudName = cloudName
    this.initialized = true
  }

  private static ensureInitialized() {
    if (!this.initialized) {
      // Initialize with environment variable (available in client)
      this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
      this.initialized = true
    }
  }

  /**
   * Generate a Cloudinary URL for client-side use
   */
  static getImageUrl(
    publicId: string,
    options?: {
      width?: number
      height?: number
      crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit'
      quality?: number | 'auto'
      format?: 'webp' | 'jpg' | 'png' | 'auto'
      gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
      dpr?: number | 'auto'
      fetch_format?: 'auto'
      effect?: string
      transformation?: any[]
    }
  ): string {
    this.ensureInitialized()
    
    if (!this.cloudName) {
      // Fallback to placeholder service for development
      return this.getFallbackUrl(publicId, options)
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`
    const transformations = this.buildTransformations(options)
    
    return `${baseUrl}${transformations}/${publicId}`
  }

  /**
   * Generate an avatar URL with automatic face detection
   */
  static getAvatarUrl(
    publicId: string,
    size: number = 150
  ): string {
    return this.getImageUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    })
  }

  /**
   * Generate a cover image URL
   */
  static getCoverImageUrl(
    publicId: string,
    width: number = 800,
    height: number = 400
  ): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    })
  }

  /**
   * Generate a thumbnail URL
   */
  static getThumbnailUrl(
    publicId: string,
    width: number = 300,
    height: number = 200
  ): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    })
  }

  /**
   * Build transformation string from options
   */
  private static buildTransformations(options?: any): string {
    if (!options) return ''

    const transformations: string[] = []

    // Handle nested transformations array
    if (options.transformation && Array.isArray(options.transformation)) {
      options.transformation.forEach((trans: any) => {
        transformations.push(this.buildTransformationString(trans))
      })
    }

    // Handle direct options
    transformations.push(this.buildTransformationString(options))

    const filtered = transformations.filter(t => t.length > 0)
    return filtered.length > 0 ? `/${filtered.join('/')}` : ''
  }

  /**
   * Build single transformation string
   */
  private static buildTransformationString(options: any): string {
    const parts: string[] = []

    if (options.width) parts.push(`w_${options.width}`)
    if (options.height) parts.push(`h_${options.height}`)
    if (options.crop) parts.push(`c_${options.crop}`)
    if (options.gravity) parts.push(`g_${options.gravity}`)
    if (options.quality) parts.push(`q_${options.quality}`)
    if (options.format) parts.push(`f_${options.format}`)
    if (options.dpr) parts.push(`dpr_${options.dpr}`)
    if (options.fetch_format) parts.push(`f_${options.fetch_format}`)
    if (options.effect) parts.push(`e_${options.effect}`)

    return parts.join(',')
  }

  /**
   * Fallback URL generator for development/unconfigured
   */
  private static getFallbackUrl(publicId: string, options?: any): string {
    // Extract meaningful parts from publicId for fallback
    const nameParts = publicId.split('/')
    const lastName = nameParts[nameParts.length - 1] || 'image'
    const cleanName = lastName.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Use placeholder services based on context
    if (publicId.includes('avatar') || options?.width === options?.height) {
      // Avatar placeholder
      const size = options?.width || 150
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random&size=${size}x${size}`
    } else {
      // General image placeholder
      const width = options?.width || 800
      const height = options?.height || 400
      const keywords = cleanName.split('_').filter(word => word.length > 2)
      const searchQuery = keywords.length > 0 ? keywords.join(',') : 'technology'
      return `https://source.unsplash.com/${width}x${height}/?${searchQuery}`
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  static isConfigured(): boolean {
    this.ensureInitialized()
    return !!this.cloudName && this.cloudName !== 'your_cloud_name'
  }

  /**
   * Get Cloudinary configuration status
   */
  static getConfigStatus() {
    this.ensureInitialized()
    return {
      configured: this.isConfigured(),
      cloudName: this.cloudName,
      hasCredentials: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    }
  }
}

// Server-side utilities (only imported in server components)
export const ServerCloudinaryService = typeof window === 'undefined' ? {
  // These will be replaced by actual server-side implementation
  uploadImage: async () => ({ success: false, error: 'Server-side only' }),
  deleteImage: async () => ({ success: false, error: 'Server-side only' }),
  getImageInfo: async () => ({ success: false, error: 'Server-side only' }),
} : null

// Predefined image configurations
export const CLOUDINARY_FOLDERS = {
  AVATARS: 'avatars',
  COVERS: 'covers',
  UPLOADS: 'uploads',
  TEMP: 'temp',
} as const

// Default image transformations
export const DEFAULT_TRANSFORMATIONS = {
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill' as const,
    gravity: 'face' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  cover: {
    width: 800,
    height: 400,
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
} as const