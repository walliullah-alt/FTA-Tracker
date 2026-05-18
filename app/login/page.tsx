import { redirect } from "next/navigation";

// Login page no longer used — person selection is on the tracker page
export default function LoginPage() {
  redirect("/tracker");
}
