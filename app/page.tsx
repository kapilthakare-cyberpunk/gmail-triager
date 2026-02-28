import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function runNow() {
  "use server";
  await fetch("/api/triage/run", { method: "POST" });
}

export default async function Page() {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Inbox Triager</h1>
        <p>
          <a href="/api/auth/signin">Sign in</a>
        </p>
      </main>
    );
  }

  const { rows } = await sql<any>`
    select message_id, internal_date, from_email, subject, snippet, category, priority
    from triage_messages
    order by processed_at desc
    limit 200
  `;

  return (
    <main style={{ padding: 24 }}>
      <h1>Inbox Triager</h1>
      <p>Signed in as: {session.user.email}</p>

      <form action={runNow}>
        <button type="submit">Run now</button>
      </form>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">When</th>
            <th align="left">From</th>
            <th align="left">Subject</th>
            <th align="left">Category</th>
            <th align="left">Priority</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.message_id} style={{ borderTop: "1px solid #ddd" }}>
              <td style={{ padding: 8 }}>
                {r.internal_date
                  ? new Date(r.internal_date).toLocaleString("en-IN")
                  : ""}
              </td>
              <td style={{ padding: 8 }}>{r.from_email}</td>
              <td style={{ padding: 8 }}>
                <div>
                  <strong>{r.subject}</strong>
                </div>
                <div style={{ color: "#555" }}>{r.snippet}</div>
              </td>
              <td style={{ padding: 8 }}>{r.category}</td>
              <td style={{ padding: 8 }}>{r.priority}</td>
              <td style={{ padding: 8 }}>
                <form action={`/api/triage/message/${r.message_id}`} method="post">
                  <button name="category" value="needs-attention">
                    Needs Attention
                  </button>{" "}
                  <button name="category" value="fyi">FYI</button>{" "}
                  <button name="category" value="done">Done</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
