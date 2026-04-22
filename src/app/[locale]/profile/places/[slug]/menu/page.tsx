import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ProfileMenuRedirectPage({ params }: Props) {
  const { locale, slug } = await params;
  redirect(`/${locale}/p/${slug}`);
}

