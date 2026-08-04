import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase.from("members").select("*");

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Error al consultar members: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Usuario autenticado: {user.email}</p>

      {data && data.length > 0 ? (
        <table border={1} cellPadding={6} style={{ marginTop: 16 }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={`${row.id ?? index}-${index}`}>
                {Object.values(row).map((value, valueIndex) => (
                  <td key={`${String(value)}-${valueIndex}`}>{String(value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay registros en members.</p>
      )}
    </main>
  );
}
