import { redirect } from "next/navigation";

// `/index` is an alias for the node index at `/nodes`.
export default function IndexPage() {
  redirect("/nodes");
}
