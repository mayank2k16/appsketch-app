/**
 * Dummy data for home screen API responses
 * Used when backend is unavailable or for development
 */

import type {
  UserProfile,
  Announcement,
  RecentlyViewedItem,
  OrderStatusCounts,
  Story,
  Product,
  Category,
} from './types';

export const mockUserProfile: UserProfile = {
  id: 'user-1',
  firstName: 'Romina',
  fullName: 'Romina',
  profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
};

export const mockAnnouncement: Announcement = {
  id: 'ann-1',
  title: 'Announcement',
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit luctus libero ac vulputate.',
  actionLink: '/announcements/1',
};

export const mockRecentlyViewed: RecentlyViewedItem[] = [
  { id: 'rv-1', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
  { id: 'rv-2', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200' },
  { id: 'rv-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200' },
  { id: 'rv-4', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
  { id: 'rv-5', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' },
];

export const mockOrderCounts: OrderStatusCounts = {
  toPay: 0,
  toReceive: 2,
  toReview: 0,
};

export const mockStories: Story[] = [
  {
    id: 'story-1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    isLive: true,
    title: 'Live',
  },
  {
    id: 'story-2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    isLive: false,
  },
  {
    id: 'story-3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400',
    isLive: false,
  },
  {
    id: 'story-4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    isLive: false,
  },
];

export const mockNewItems: Product[] = [
  {
    id: 'new-1',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    title: 'Lorem ipsum dolor sit amet consectetur.',
    price: 17,
    brand: 'Brand A',
  },
  {
    id: 'new-2',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    title: 'Lorem ipsum dolor sit amet consectetur.',
    price: 32,
    brand: 'Brand B',
  },
  {
    id: 'new-3',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    title: 'Lorem ipsum dolor sit amet consectetur.',
    price: 21,
    brand: 'Brand C',
  },
];

export const mockMostPopular: Product[] = [
  {
    id: 'pop-1',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    title: 'Classic White Tee',
    price: 29.99,
    likesCount: 1780,
    statusTag: 'New',
  },
  {
    id: 'pop-2',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    title: 'Blue Denim Jeans',
    price: 79.99,
    originalPrice: 99.99,
    likesCount: 920,
    statusTag: 'Sale',
  },
  {
    id: 'pop-3',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    title: 'Leather Jacket',
    price: 199.99,
    likesCount: 2100,
    statusTag: 'Hot',
  },
];

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Clothing',
    itemCount: 109,
    previewImageUrls: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
    ],
  },
  {
    id: 'cat-2',
    name: 'Shoes',
    itemCount: 530,
    previewImageUrls: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=200',
    ],
  },
  {
    id: 'cat-3',
    name: 'Accessories',
    itemCount: 245,
    previewImageUrls: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
    ],
  },
];
