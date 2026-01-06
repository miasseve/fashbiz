// ============= app/api/dkkpointsrule/route.js =============
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDKKPointRules } from "@/actions/dkkPointsRules";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const pointsRule = await getDKKPointRules(session.user.id);
    return NextResponse.json(pointsRule);
  } catch (err) {
    console.error("Error in fetching points:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}