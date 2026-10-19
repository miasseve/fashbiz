export function canPostToInstagram(subscriptionType) {
  if (!subscriptionType) return false;
  const sub = subscriptionType.toLowerCase();
  return ["pro", "business", "lestores-ai", "lestores-ai-web", "lestores-web", "link",
    "ads basic", "add_basic", "ads pro", "add_pro",
    "webstore basic", "webstore pro"].some(plan => sub === plan || sub.includes(plan));
}
