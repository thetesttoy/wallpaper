export interface Wallpaper {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  author?: string | null
  authorUrl?: string | null
  authorId?: string | null
  pixivUrl?: string | null
  pixivId?: string | null
  views: number
  likes: number
  downloads: number
  viewCount?: number
  ratingCount?: number
  rank?: number
  tags?: string[]
  uploadTime?: string
  addedDate?: string
  resolution?: string
  fileSize?: string
  category?: string
  width?: number
  height?: number
  aspectRatio?: string
  colorPalette?: string[]
  sourceUrl?: string
  license?: string
  isFavorite?: boolean
}

export interface WallpaperCategory {
  id: string
  name: string
  description?: string
  count: number
  icon?: string
}

export interface WallpaperFilter {
  category?: string
  tags?: string[]
  minWidth?: number
  minHeight?: number
  aspectRatio?: string
  sortBy?: 'latest' | 'popular' | 'trending' | 'random'
  searchQuery?: string
  page?: number
  pageSize?: number
}

export interface WallpaperResponse {
  data: Wallpaper[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface FavoriteWallpaper {
  wallpaperId: string
  userId: string
  addedAt: string
  wallpaper: Wallpaper
}

export interface DownloadHistory {
  wallpaperId: string
  userId: string
  downloadedAt: string
  wallpaper: Wallpaper
}

export interface UploadWallpaperRequest {
  title: string
  description?: string
  imageFile: File
  tags?: string[]
  category?: string
  author?: string
  resolution?: string
  license?: string
}

export interface UploadWallpaperResponse {
  id: string
  imageUrl: string
  thumbnailUrl: string
  uploadTime: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
