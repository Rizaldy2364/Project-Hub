"use server";

import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth.schema";
import { createUser, findUserByEmail, updateUser, findUserById, updateUserCoverGradient } from "@/repositories/user.repository";
import {
  updateProfileSchema,
  changePasswordSchema,
  coverGradientSchema,
} from "@/lib/validations/user.schema";
import { auth, signOut } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),  
  });



  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existingUser = await findUserByEmail(parsed.data.email);
  if (existingUser) {
    return { error: { email: ["Email sudah terdaftar"] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

// CREATE USER
  await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    password: hashedPassword,
  });

  return { success: true };
}

// UPDATE PROFILE
export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateUser(session.user.id, {
    name: parsed.data.name,
    bio: parsed.data.bio,
  });

  revalidatePath("/profile");
  return { success: true };
}

// CHANGE PASSWORD
export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const user = await findUserById(session.user.id);
  if (!user) return { error: "User tidak ditemukan" };

  const isCurrentPasswordValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password
  );
  if (!isCurrentPasswordValid) {
    return { error: { currentPassword: ["Password saat ini salah"] } };
  }

  const hashedNewPassword = await bcrypt.hash(parsed.data.newPassword, 10);
  await updateUser(session.user.id, { password: hashedNewPassword });

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function updateCoverGradientAction(gradient: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  const parsed = coverGradientSchema.safeParse(gradient);
  if (!parsed.success) return { error: "Gradient tidak valid" };

  await updateUserCoverGradient(session.user.id, parsed.data);
  revalidatePath("/profile");
  return { success: true };
}

export async function updateBioAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const bio = formData.get("bio");
  if (typeof bio !== "string") return { error: "Bio tidak valid" };

  const parsed = updateProfileSchema.shape.bio.safeParse(bio);
  if (!parsed.success) return { error: "Bio maksimal 160 karakter" };

  await updateUser(session.user.id, { bio: bio.trim() || null });
  revalidatePath("/profile");
  return { success: true };
}

export async function updateNameAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = updateProfileSchema.shape.name.safeParse(formData.get("name"));
  if (!parsed.success) return { error: "Nama harus berisi 2 sampai 50 karakter" };

  await updateUser(session.user.id, { name: parsed.data });
  revalidatePath("/profile", "layout");
  return { success: true };
}
