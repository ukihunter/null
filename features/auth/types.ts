"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};

export interface LogoutButtonProps {
  children: React.ReactNode;
}
