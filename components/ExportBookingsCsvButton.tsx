"use client";

type BookingExportRow = {
  booking_date: string;
  classes?: { name?: string; start_time?: string } | null;
  members?: { full_name?: string; phone?: string } | null;
  status: string;
};

type ExportBookingsCsvButtonProps = {
  bookings: BookingExportRow[];
};

export default function ExportBookingsCsvButton({ bookings }: ExportBookingsCsvButtonProps) {
  function handleExport() {
    const rows = [
      ["fecha", "clase", "horario", "socio", "teléfono", "estado"],
      ...bookings.map((booking) => [
        booking.booking_date,
        booking.classes?.name ?? "-",
        booking.classes?.start_time ?? "-",
        booking.members?.full_name ?? "-",
        booking.members?.phone ?? "-",
        booking.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reservas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
    >
      Exportar CSV
    </button>
  );
}
