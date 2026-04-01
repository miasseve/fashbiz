import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReviewQueueClient from "./ReviewQueueClient";

export const metadata = {
  title: "Review Queue — Low Confidence Products",
};

const ReviewQueuePage = async () => {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <ReviewQueueClient />;
};

export default ReviewQueuePage;
