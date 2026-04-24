import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicComponentsScheduledPricesRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/uz/p/${slug}/components/scheduled-prices`);
}

