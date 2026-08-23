import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export const ComplaintTable = ({ complaints }) => {
  const navigate = useNavigate();

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Resident</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date Filed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No complaints found matching filters.
              </td>
            </tr>
          ) : (
            complaints.map((c) => {
              const date = new Date(c.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <tr key={c.id} style={{ borderLeft: c.is_overdue ? '3px solid var(--status-overdue)' : 'none' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        #{c.id.substring(0, 8).toUpperCase()}
                      </span>
                      {c.is_overdue && (
                        <span title="Overdue Complaint" style={{ color: 'var(--status-overdue)', display: 'inline-flex' }}>
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{c.category}</td>
                  <td>{c.resident_name || 'Resident'}</td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{date}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintTable;
