export function canPostToInstagram(subscriptionType) {
  if (!subscriptionType) return false;
  const sub = subscriptionType.toLowerCase();
  const exactPlans = ["pro", "business", "lestores-ai", "lestores-ai-web", "lestores-web", "link",
    "ads basic", "add_basic", "ads pro", "add_pro",
    "webstore basic", "webstore pro"];
  return exactPlans.some(plan => sub === plan);
}
