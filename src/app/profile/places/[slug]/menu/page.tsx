import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MenuBuilderRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/uz/profile/places/${slug}/menu`);
}

