import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, RotateCcw, Plus, Filter, SlidersHorizontal } from 'lucide-react';
import ComplaintTable from '../components/ComplaintTable';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Security', 'Lift', 'Water Supply', 'Parking', 'Maintenance', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const AllComplaints = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Query parameters state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('overdue'); // Overdue is default to show overdue on top
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // API response state
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search input state (debounced query)
  const [searchInput, setSearchInput] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        sort_by: sortBy
      };

      if (category) params.category = category;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (overdueOnly) params.overdue_only = overdueOnly;
      if (search) params.search = search;
      if (dateStart) params.date_start = new Date(dateStart).toISOString();
      if (dateEnd) params.date_end = new Date(dateEnd).toISOString();

      const response = await api.get('/complaints', { params });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to fetch complaints list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on query change
  useEffect(() => {
    fetchComplaints();
  }, [page, category, status, priority, overdueOnly, search, sortBy, dateStart, dateEnd]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setCategory('');
    setStatus('');
    setPriority('');
    setOverdueOnly(false);
    setSearch('');
    setSearchInput('');
    setSortBy('overdue');
    setDateStart('');
    setDateEnd('');
    setPage(1);
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      
      {/* Header and Raise Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 0 }}>
            {isAdmin 
              ? 'View and administrate complaints submitted by society residents' 
              : 'Browse and track progress on complaints you have raised'}
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => navigate('/complaints/raise')} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Raise Complaint</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel" style={{ marginBottom: '24px', padding: '20px' }}>
        
        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search 
              size={18} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="Search by Complaint ID, resident name, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
            Search
          </button>
        </form>

        {/* Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', alignItems: 'flex-end' }} className="filters-responsive">
          
          {/* Category Filter */}
          <div>
            <label htmlFor="filter-category" style={{ fontSize: '12px' }}>Category</label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" style={{ fontSize: '12px' }}>Status</label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="filter-priority" style={{ fontSize: '12px' }}>Priority</label>
            <select
              id="filter-priority"
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(pr => <option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="filter-sort" style={{ fontSize: '12px' }}>Sort By</label>
            <select
              id="filter-sort"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="overdue">Overdue First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority First</option>
            </select>
          </div>

          {/* Buttons Area */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleResetFilters} 
              className="btn btn-secondary"
              style={{ width: '100%', padding: '9px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              title="Reset Filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Date Ranges and Overdue Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Overdue checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0, userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Show Overdue Only
            </span>
          </label>

          {/* Date range filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="dates-responsive">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Date range:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', fontSize: '12px', width: '130px' }}
              aria-label="Start date"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', fontSize: '12px', width: '130px' }}
              aria-label="End date"
            />
          </div>

        </div>

      </div>

      {/* Complaints List Table Content */}
      {error && <ErrorMessage message={error} onRetry={fetchComplaints} />}

      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <ComplaintTable complaints={data.items} />
          
          <Pagination
            page={data.page}
            pages={data.pages}
            limit={data.limit}
            total={data.total}
            onPageChange={(pageNum) => setPage(pageNum)}
          />
        </div>
      )}

      {/* Responsive adjustments styling */}
      <style>{`
        @media (max-width: 768px) {
          .filters-responsive {
            grid-template-columns: 1fr 1fr !important;
          }
          .dates-responsive {
            width: 100%;
            justify-content: space-between;
          }
        }
        @media (max-width: 480px) {
          .filters-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AllComplaints;
