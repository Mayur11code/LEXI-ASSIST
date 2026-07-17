// src/app/actions/register.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function registerClient(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const { name, email, password } = formData;

  // 1. Basic input validation
  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: "All profile parameters must be filled." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    // 2. Check if the record already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email address already exists." };
    }


    // 3. Create the new Client user profile
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: "CLIENT", 
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[REGISTRATION ERROR] Failed to provision user:", error);
    return { success: false, error: "System isolation layer error during provisioning." };
  }
}