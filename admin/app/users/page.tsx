import Link from "next/link";
import { get, money, when } from "@/lib/api";
import type { UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const { users } = await get<{ users: UserRow[] }>(
    `/api/admin/users?${params.toString()}`
  );

  return (
    <>
      <h1>Users</h1>
      <p className="sub">
        Balance and spend come back with the list in one query — never one query
        per row.
      </p>

      <form className="row" method="get">
        <input name="q" defaultValue={q} placeholder="Search by email" />
        <select name="status" defaultValue={status}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="act" type="submit">Filter</button>
      </form>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Sign-in</th>
              <th className="num">Credits</th>
              <th className="num">Searches</th>
              <th className="num">Spend</th>
              <th>Joined</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/users/${u.id}`}>{u.email}</Link></td>
                <td><span className={`pill ${u.status}`}>{u.status}</span></td>
                {/* Unverified is called out because it is a SPENDING block,
                    not a profile detail: every paid action refuses with
                    emailUnverified until the link is clicked. */}
                <td>
                  {u.email_verified ? (
                    <span className="doors">
                      {u.has_password ? "password" : ""}
                      {u.has_password && u.has_google ? " + " : ""}
                      {u.has_google ? "google" : ""}
                    </span>
                  ) : (
                    <span className="pill suspended">unverified</span>
                  )}
                </td>
                <td className={`num${u.balance < 0 ? " neg" : ""}`}>{u.balance}</td>
                <td className="num">{u.searches}</td>
                <td className="num">{money(u.spend_usd)}</td>
                <td>{when(u.created_at)}</td>
                <td>{when(u.last_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="empty">No users match.</p>}
      </div>
    </>
  );
}
