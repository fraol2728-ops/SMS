import type { AdminSettings, Campus, User } from "@prisma/client";

export type AdminSettingsData = AdminSettings | null;
export type AdminUserData = User & { campus?: Campus | null };
