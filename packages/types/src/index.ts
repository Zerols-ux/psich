// Shared TypeScript types between apps/web, apps/admin, apps/api.
// Keep in sync with apps/api/prisma/schema.prisma — Prisma is the source of truth
// for DB enums; these duplicates exist so that frontends do not import the Prisma
// client directly.

export type UUID = string;
export type ISODateString = string;

export const UserRole = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LessonType = {
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  PDF: 'PDF',
  WEBINAR: 'WEBINAR',
} as const;
export type LessonType = (typeof LessonType)[keyof typeof LessonType];

export const OrderStatus = {
  PENDING: 'PENDING',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentProvider = {
  LIQPAY: 'LIQPAY',
  MONOBANK: 'MONOBANK',
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export interface User {
  id: UUID;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AuthSuccess {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Category {
  id: UUID;
  name: string;
  slug: string;
}

export interface Course {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  price: number;
  isPublished: boolean;
  categoryId: UUID | null;
  category?: Category | null;
  lessonsCount?: number;
  createdAt: ISODateString;
}

export interface Lesson {
  id: UUID;
  courseId: UUID;
  title: string;
  type: LessonType;
  youtubeUrl: string | null;
  contentMd: string | null;
  pdfUrl: string | null;
  meetLink: string | null;
  webinarAt: ISODateString | null;
  isFree: boolean;
  orderIndex: number;
}

export interface Enrollment {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  enrolledAt: ISODateString;
}

export interface Order {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  amount: number;
  status: OrderStatus;
  paymentProvider: PaymentProvider;
  providerOrderId: string | null;
  createdAt: ISODateString;
}

export interface LessonProgress {
  id: UUID;
  userId: UUID;
  lessonId: UUID;
  completed: boolean;
  completedAt: ISODateString | null;
}

export interface Certificate {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  pdfUrl: string;
  version: number;
  issuedAt: ISODateString;
}

export interface Comment {
  id: UUID;
  userId: UUID;
  lessonId: UUID;
  body: string;
  createdAt: ISODateString;
}

export interface PromoCode {
  id: UUID;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt: ISODateString | null;
}

export interface BlogPost {
  id: UUID;
  title: string;
  slug: string;
  contentMd: string;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: ISODateString | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthcheckResponse {
  status: 'ok';
  uptime: number;
  timestamp: ISODateString;
  version: string;
}
