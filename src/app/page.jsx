import { redirect } from "next/navigation";

export const metadata = {
  title: "REE - Resale e-commerce, Reimagined",
  description:
    "The all-in-one resale platform. Get your own online store, handle payments, and connect with buyers — in minutes.",
};

export default function Home() {
  redirect("/try/add-product");
}
