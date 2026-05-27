import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are accepted." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 5 MB limit." },
      { status: 400 }
    );
  }

  // Fetch current item to delete old blob if present
  const item = await prisma.item.findUnique({
    where: { id },
    select: { photoUrl: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  // Delete old blob
  if (item.photoUrl) {
    try {
      await del(item.photoUrl);
    } catch {
      // non-fatal
    }
  }

  // Upload new blob
  const blob = await put(`items/${id}/${Date.now()}-${file.name}`, file, {
    access: "public",
    contentType: file.type,
  });

  // Save URL to item
  await prisma.item.update({
    where: { id },
    data: { photoUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    select: { photoUrl: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (item.photoUrl) {
    try {
      await del(item.photoUrl);
    } catch {
      // non-fatal
    }
  }

  await prisma.item.update({
    where: { id },
    data: { photoUrl: null },
  });

  return NextResponse.json({ success: true });
}
