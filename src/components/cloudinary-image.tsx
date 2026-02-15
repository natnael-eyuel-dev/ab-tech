'use client'

import { useState } from 'react'
import { CloudinaryService } from '@/lib/cloudinary'

interface CloudinaryImageProps {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  type?: 'avatar' | 'cover' | 'thumbnail' | 'custom'
  transformation?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'crop' | 'scale'
    quality?: number | 'auto'
    format?: 'webp' | 'jpg' | 'png' | 'auto'
    gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  }
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  className = '',
  priority = false,
  type = 'custom',
  transformation,
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
  onLoad,
  onError,
}: CloudinaryImageProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (type === 'avatar') {
      return CloudinaryService.getAvatarUrl(publicId, width || 150)
    } else if (type === 'cover') {
      return CloudinaryService.getCoverImageUrl(publicId, width || 800, height || 400)
    } else if (type === 'thumbnail') {
      return CloudinaryService.getImageUrl(publicId, {
        width: width || 300,
        height: height || 200,
        crop: 'fill',
        gravity: 'auto',
        quality: 75,
        format: 'auto',
      })
    } else {
      return CloudinaryService.getImageUrl(publicId, transformation)
    }
  })

  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  if (hasError) {
    return (
      <img
        src={fallback}
        alt={alt}
        width={width || 150}
        height={height || 150}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          width: width ? `${width}px` : 'auto',
          maxWidth: '100%',
          height: height ? `${height}px` : 'auto'
        }}
      />
    )
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width || 150}
        height={height || 150}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        style={{ 
          width: width ? `${width}px` : 'auto',
          maxWidth: '100%',
          height: height ? `${height}px` : 'auto',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Predefined avatar sizes
export function Avatar({
  publicId,
  alt,
  size = 150,
  className = '',
  priority = false,
}: {
  publicId: string
  alt: string
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <CloudinaryImage
      publicId={publicId}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      type="avatar"
      priority={priority}
    />
  )
}

// Cover image component
export function CoverImage({
  publicId,
  alt,
  width = 800,
  height = 400,
  className = '',
  priority = false,
}: {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}) {
  return (
    <CloudinaryImage
      publicId={publicId}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      type="cover"
      priority={priority}
    />
  )
}

// Thumbnail component
export function Thumbnail({
  publicId,
  alt,
  width = 300,
  height = 200,
  className = '',
  priority = false,
}: {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}) {
  return (
    <CloudinaryImage
      publicId={publicId}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      type="thumbnail"
      priority={priority}
    />
  )
}