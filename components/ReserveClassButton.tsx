"use client";

import { useState } from "react";

type ReserveClassButtonProps = {
  classId: number;
  className: string;
  bookingDate: string;
};

export default function ReserveClassButton({
  classId,
  className,
  bookingDate,
}: ReserveClassButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(bookingDate);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReserve() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId,
        bookingDate: selectedDate,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo realizar la reserva.");
    } else {
      setMessage(`Reserva confirmada para ${className} en ${selectedDate}.`);
      setIsOpen(false);
    }

    setIsSubmitting(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={() => setIsOpen((current) => !current)}>
        Reservar
      </button>

      {isOpen ? (
        <div style={{ marginTop: 12 }}>
          <label htmlFor={`date-${classId}`}>Fecha</label>
          <br />
          <input
            id={`date-${classId}`}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <br />
          <button
            type="button"
            onClick={handleReserve}
            disabled={isSubmitting}
            style={{ marginTop: 8 }}
          >
            {isSubmitting ? "Confirmando..." : "Confirmar reserva"}
          </button>
        </div>
      ) : null}

      {message ? <p>{message}</p> : null}
    </div>
  );
}
