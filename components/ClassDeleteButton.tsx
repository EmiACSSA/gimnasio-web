"use client";

type ClassDeleteButtonProps = {
  classId: number;
  deleteAction: (formData: FormData) => Promise<void>;
};

export default function ClassDeleteButton({ classId, deleteAction }: ClassDeleteButtonProps) {
  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    const shouldDelete = window.confirm("¿Seguro que querés eliminar esta clase?");
    if (!shouldDelete) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={classId} />
      <button
        type="submit"
        onClick={handleDelete}
        className="border border-[var(--border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Eliminar
      </button>
    </form>
  );
}
