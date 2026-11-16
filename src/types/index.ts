export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  subcategories: string[];
  active: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface Business {
  id: number;
  ownerUid?: string | null;
  ownerName: string;
  name: string;
  categoryId: number;
  categoryName: string;
  subcategory?: string | null;
  description: string;
  whatsapp: string;
  keywords: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  categoriesCount: number;
  unreadMessages: number;
}
