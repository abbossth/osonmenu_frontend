type SubscribedUser = {
  subscriptionStatus?: "active" | "inactive";
  currentPeriodEnd?: Date | string | null;
};

export function isUserSubscribed(user: SubscribedUser | null | undefined) {
  if (!user) return false;
  if (user.subscriptionStatus !== "active") return false;
  if (!user.currentPeriodEnd) return false;

  const periodEnd = user.currentPeriodEnd instanceof Date
    ? user.currentPeriodEnd
    : new Date(user.currentPeriodEnd);

  if (Number.isNaN(periodEnd.getTime())) return false;
  return periodEnd.getTime() > Date.now();
}
