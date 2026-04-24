import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicMoreRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/uz/p/${slug}/more`);
}

