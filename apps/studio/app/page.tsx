import { redirect } from "next/navigation";

// "/" is normally handled by middleware; this is a server-side fallback.
export default function Index() {
  redirect("/studio");
}
