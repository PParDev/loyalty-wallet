import type { DefaultSession } from "next-auth";

// Extender la sesión de NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: "admin" | "cashier";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    businessId: string;
    role: "admin" | "cashier";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    businessId: string;
    role: "admin" | "cashier";
  }
}

// Respuesta estándar de la API
export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// Tipos del dominio
export type BusinessCategory =
  | "cafeteria"
  | "barberia"
  | "restaurante"
  | "farmacia"
  | "lavanderia"
  | "otro";

export type UserRole = "admin" | "cashier";

export type TransactionType = "earn" | "redeem" | "adjust";

export type RewardType = "discount" | "freebie" | "upgrade";

export type NotificationType = "push" | "geo" | "scheduled";

export type NotificationStatus = "draft" | "scheduled" | "sent";

export interface BusinessPublicInfo {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  program: {
    id: string;
    name: string;
    pointsPerVisit: number;
    pointsPerCurrency: number;
    cardBgColor: string;
    cardTextColor: string;
  } | null;
}

export interface TierInfo {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  benefits: string | null;
  multiplier: number;
}

export interface CardScanResult {
  cardId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  currentPoints: number;
  totalPointsEarned: number;
  totalVisits: number;
  lastVisit: Date | null;
  pointsExpiresAt: Date | null;
  availableRewards: AvailableReward[];
  program: {
    name: string;
    programType: string;
    pointsPerVisit: number;
    pointsPerCurrency: number;
    stampsRequired: number;
    pointsExpirationDays: number | null;
  };
  tier: TierInfo | null;
}

export interface AvailableReward {
  id: string;
  name: string;
  description: string | null;
  pointsRequired: number;
  rewardType: string;
}

export interface BusinessLink {
  id: string;
  label: string;
  url: string;
}

export interface DashboardStats {
  totalCustomers: number;
  visitsToday: number;
  pointsRedeemedThisMonth: number;
  activeCards: number;
}

export interface RecentActivity {
  id: string;
  type: TransactionType;
  points: number;
  customerName: string;
  description: string | null;
  createdAt: Date;
}
