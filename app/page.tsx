import { buildGraphData } from "@/lib/content";
import { getCategories } from "@/lib/content";
import PageClient from "@/components/PageClient";

export default async function Home() {
  const graphData = await buildGraphData();
  const categories = getCategories();

  return <PageClient graphData={graphData} categories={categories} />;
}
