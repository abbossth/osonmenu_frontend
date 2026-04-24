import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicComponentsVisibilityRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/uz/p/${slug}/components/visibility`);
}

