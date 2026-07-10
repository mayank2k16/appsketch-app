/**
 * Home screen API types
 * Aligns with the homepage sections: profile, announcements, orders, stories, products, categories
 */

export type UserProfile = {
  id: string;
  firstName: string;
  fullName: string;
  profilePictureUrl: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  actionLink?: string;
};

export type RecentlyViewedItem = {
  id: string;
  imageUrl: string;
  title?: string;
};

export type OrderStatusCounts = {
  toPay: number;
  toReceive: number;
  toReview: number;
};

export type Story = {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string;
  isLive: boolean;
  title?: string;
};


export type Product = {
  id: number;
  name: string;
  description: string;

  alternate_names: string[];
  features: string[];

  price: string;               // comes as string "450.0000"
  mrp: string;                 // string "500.0000"
  discount_percent: number;

  image_url: string;
  images: string[];
  videos: string[];

  media_display_priority: 'IMAGES' | 'VIDEOS';

  quantity_remaining: number;
};

// export type Category = {
//   id: string;
//   name: string;
//   itemCount: number;
//   previewImageUrls: [string, string];
// };

export type Category = {
  id: number;
  image: string;
  name: string;
  description: string;
  slug: string;
  products: number[];
  home_page: boolean;
};

export type CategoriesApiResponse = {
  data: Category[];
  status: number;
  message: string;
};

export type Catalog = {
  id: number;
  image: string;
  name: string;
  description: string;
  slug: string;
  products: number[];
  home_page: boolean;
};

export type CatalogApiResponse = {
  data: Catalog[];
  status: number;
  message: string;
};

export type HomePageData = {
  user: UserProfile;
  announcement: Announcement | null;
  recentlyViewed: RecentlyViewedItem[];
  orderCounts: OrderStatusCounts;
  stories: Story[];
  newItems: Product[];
  mostPopular: Product[];
  categories: Category[];
  catalog: Catalog[];
};
