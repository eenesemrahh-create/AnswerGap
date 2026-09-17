import { get } from "@/lib/api";
import type { CiOverview } from "@/lib/types";
import { CiBoard } from "./board";

export const dynamic = "force-dynamic";

export default async function CiPage() {
  const initial = await get<CiOverview>("/api/admin/ci");

  return (
    <>
      <h1>CI</h1>
      <p className="sub">
        Tests run on GitHub Actions against a throwaway Postgres, never on this
        server, and they run on every push to <code>{initial.branch}</code>.
        This page reads their results
        {initial.can_trigger ? " and can ask GitHub to run them again" : ""}.
        Railway deploys that branch whether or not they pass, unless
        &ldquo;Wait for CI&rdquo; is switched on for each service.
      </p>
      <CiBoard initial={initial} />
    </>
  );
}
