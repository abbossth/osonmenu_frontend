import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string; categoryId: string }>;
};

export default async function PublicCategoryRedirectPage({ params }: Props) {
  const { slug, categoryId } = await params;
  redirect(`/uz/p/${slug}/${categoryId}`);
}

