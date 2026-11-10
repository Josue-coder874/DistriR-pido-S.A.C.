function PaginationControls({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      <span>
        Página {page} de {totalPages} · {total} registros
      </span>
      <div>
        <button type="button" className="secondary-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Anterior
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}

export default PaginationControls;
