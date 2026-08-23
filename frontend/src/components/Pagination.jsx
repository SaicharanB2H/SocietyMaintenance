import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const Pagination = ({ page, pages, limit, total, onPageChange }) => {
  if (pages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const numbers = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderTop: '1px solid var(--glass-border)',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  };

  const buttonStyle = {
    padding: '8px 12px',
    fontSize: '13px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'var(--transition-fast)'
  };

  return (
    <div style={containerStyle}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Showing page <strong>{page}</strong> of <strong>{pages}</strong> ({total} entries)
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          style={{ ...buttonStyle, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...buttonStyle, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numeric page buttons */}
        {getPageNumbers().map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            style={{
              ...buttonStyle,
              background: page === num ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: page === num ? 'var(--primary)' : 'var(--glass-border)',
              fontWeight: page === num ? '700' : '500',
            }}
          >
            {num}
          </button>
        ))}

        {/* Next page button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          style={{ ...buttonStyle, opacity: page === pages ? 0.3 : 1, cursor: page === pages ? 'not-allowed' : 'pointer' }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(pages)}
          disabled={page === pages}
          style={{ ...buttonStyle, opacity: page === pages ? 0.3 : 1, cursor: page === pages ? 'not-allowed' : 'pointer' }}
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
