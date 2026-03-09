import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, firmName, password } = body;

    if (!name || !email || !firmName || !password) {
      return errorResponse("All fields are required", 400);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: firmName },
      });

      const firm = await tx.firm.create({
        data: {
          name: firmName,
          organizationId: organization.id,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
          role: "ADMIN",
          organizationId: organization.id,
          firmId: firm.id,
        },
      });

      return { user, organization, firm };
    });

    return successResponse(
      {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        firmName: result.firm.name,
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
