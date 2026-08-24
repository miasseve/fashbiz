import DiscoverLoginForm from "./DiscoverLoginForm";

export const metadata = {
  title: "Sign in — leStores AI",
};

const DiscoverLogin = async ({ searchParams }) => {
  const params = await searchParams;
  const redirectUri = typeof params?.redirect_uri === "string" ? params.redirect_uri : "";

  return <DiscoverLoginForm redirectUri={redirectUri} />;
};

export default DiscoverLogin;
