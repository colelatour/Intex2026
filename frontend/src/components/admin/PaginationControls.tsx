// src/components/admin/PaginationControls.tsx

function getPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

interface Props {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  label: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  label,
}: Props) {
  const items = getPageItems(currentPage, totalPages);

  return (
    <div className="supporter-pagination">
      <span>{label}</span>
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <select
          className="filter-btn"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={30}>30 / page</option>
        </select>

        <button
          className="filter-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{ padding: '3px 10px' }}
        >‹</button>

        {items.map((item, idx) =>
          item === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              style={{ padding: '3px 4px', color: 'var(--gray-500)', fontSize: '0.85rem' }}
            >…</span>
          ) : (
            <button
              key={item}
              className="filter-btn"
              onClick={() => onPageChange(item)}
              style={{
                padding: '3px 10px',
                background: item === currentPage ? 'var(--navy)' : 'white',
                color: item === currentPage ? 'white' : 'var(--gray-600)',
                borderColor: item === currentPage ? 'var(--navy)' : undefined,
              }}
            >{item}</button>
          )
        )}

        <button
          className="filter-btn"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{ padding: '3px 10px' }}
        >›</button>
      </div>
    </div>
  );
}
