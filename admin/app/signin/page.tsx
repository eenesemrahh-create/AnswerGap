import { translator } from "@/lib/locale";
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ failed?: string; expired?: string }>;
}) {
  const { failed, expired } = await searchParams;
  const t = await translator();
  return (
    <div className="signin">
      <h1>{t("signin.title")}</h1>
      {failed && <p className="notice">{t("signin.failed")}</p>}
      {expired && <p className="notice">{t("signin.expired")}</p>}
      <p className="sub">{t("signin.lead")}</p>
      <a href="/api/auth/start">
        <button className="act">{t("signin.button")}</button>
      </a>
    </div>
  );
}
