"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AssetCategory, AssetCondition, AssetLogAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function addAsset(labId: string, formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return err("Not authenticated");

    const category = formData.get("category") as string;
    const name = formData.get("name") as string;
    const serialNumber = formData.get("serialNumber") as string | null;
    const condition = formData.get("condition") as string;
    const notes = formData.get("notes") as string | null;

    if (!category || !name || !condition) {
      return err("Category, name, and condition are required.");
    }

    if (serialNumber?.trim()) {
      const existing = await prisma.asset.findUnique({
        where: { serialNumber: serialNumber.trim() },
      });
      if (existing) {
        return err("An asset with this serial number already exists.");
      }
    }

    const asset = await prisma.asset.create({
      data: {
        labId,
        category: category as AssetCategory,
        name: name.trim(),
        serialNumber: serialNumber?.trim() || null,
        condition: condition as AssetCondition,
        notes: notes?.trim() || null,
        addedById: userId,
      },
    });

    await prisma.assetLog.create({
      data: {
        assetId: asset.id,
        userId,
        action: "ADDED" as AssetLogAction,
        note: `Asset added to inventory${notes?.trim() ? `: ${notes.trim()}` : ""}`,
      },
    });

    revalidatePath(`/admin/inventory/${labId}`);
    revalidatePath("/admin/inventory");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to add asset");
  }
}

export async function updateAssetCondition(
  assetId: string,
  newCondition: string,
  action: string,
  note: string,
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return err("Not authenticated");

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { labId: true, condition: true },
    });

    if (!asset) return err("Asset not found");

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: { condition: newCondition as AssetCondition },
      });

      await tx.assetLog.create({
        data: {
          assetId,
          userId,
          action: action as AssetLogAction,
          note: note?.trim() || null,
        },
      });
    });

    revalidatePath(`/admin/inventory/${asset.labId}`);
    revalidatePath(`/admin/inventory/${asset.labId}/assets/${assetId}`);
    revalidatePath("/admin/inventory");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update asset");
  }
}

export async function updateAssetDetails(assetId: string, formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return err("Not authenticated");

    const name = (formData.get("name") as string)?.trim();
    const category = formData.get("category") as string;
    const serialNumber = (formData.get("serialNumber") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim();

    if (!name || !category) {
      return err("Name and category are required.");
    }

    if (serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: {
          serialNumber,
          id: { not: assetId },
        },
      });
      if (existing) {
        return err("An asset with this serial number already exists.");
      }
    }

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name,
        category: category as AssetCategory,
        serialNumber: serialNumber || null,
        notes: notes || null,
      },
      select: { labId: true },
    });

    await prisma.assetLog.create({
      data: {
        assetId,
        userId,
        action: "UPDATED",
        note: `Asset details updated${notes ? `: ${notes}` : ""}`,
      },
    });

    revalidatePath(`/admin/inventory/${asset.labId}`);
    revalidatePath(`/admin/inventory/${asset.labId}/assets/${assetId}`);
    revalidatePath("/admin/inventory");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update asset");
  }
}

export async function deleteAsset(assetId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return err("Not authenticated");

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { labId: true },
    });

    if (!asset) return err("Asset not found");

    await prisma.asset.delete({ where: { id: assetId } });

    revalidatePath(`/admin/inventory/${asset.labId}`);
    revalidatePath("/admin/inventory");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete asset");
  }
}
