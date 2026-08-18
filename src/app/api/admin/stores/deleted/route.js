import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DeletedAccountBackup from "@/models/DeletedAccountBackup";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/admin/stores/deleted — list backups from deleted accounts, most
 * recent first. Already-restored backups are included (restoredAt set) so
 * admin has a full history, not just what's still pending.
 */
export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return json({ error: "Unauthorized" }, 401);
  }

  await dbConnect();

  const backups = await DeletedAccountBackup.find({})
    .select("-data.user.password") // never send password hashes to the client
    .sort({ deletedAt: -1 })
    .lean();

  const list = backups.map((b) => ({
    _id: b._id,
    originalUserId: b.originalUserId,
    role: b.role,
    displayName: b.displayName,
    email: b.email,
    businessNumber: b.businessNumber,
    deletedAt: b.deletedAt,
    deletedByName: b.deletedByName,
    restoredAt: b.restoredAt,
    productCount: b.data?.products?.length || 0,
  }));

  return json({ backups: list });
}
