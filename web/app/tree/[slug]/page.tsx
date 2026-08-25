import { TreeScreen } from "@/components/TreeScreen";

export default async function TreePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TreeScreen slug={slug} />;
}
