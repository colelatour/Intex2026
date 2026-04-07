import { useState } from 'react';
import SupporterTable   from './donors/SupporterTable';
import SupporterSlideOver from './donors/SupporterSlideOver';
import SupporterForm    from './donors/SupporterForm';
import AtRiskTable      from './donors/AtRiskTable';

type Tab = 'supporters' | 'at-risk';

export default function DonorDashboard() {
  const [activeTab,         setActiveTab]         = useState<Tab>('supporters');
  const [selectedId,        setSelectedId]        = useState<string | null>(null);
  const [showCreateForm,    setShowCreateForm]     = useState(false);
  const [tableKey,          setTableKey]           = useState(0); // bump to force refetch

  function handleSaved() {
    setSelectedId(null);
    setShowCreateForm(false);
    setTableKey(k => k + 1);
  }

  return (
    <div className="donor-dashboard">
      {/* Tabs */}
      <div className="donor-tabs">
        <button
          className={`donor-tab${activeTab === 'supporters' ? ' active' : ''}`}
          onClick={() => setActiveTab('supporters')}
        >
          All Supporters
        </button>
        <button
          className={`donor-tab${activeTab === 'at-risk' ? ' active' : ''}`}
          onClick={() => setActiveTab('at-risk')}
        >
          At-Risk Donors
        </button>
      </div>

      {activeTab === 'supporters' && (
        <SupporterTable
          key={tableKey}
          onSelect={id => { setSelectedId(id); setShowCreateForm(false); }}
          onAdd={() => { setShowCreateForm(true); setSelectedId(null); }}
        />
      )}

      {activeTab === 'at-risk' && <AtRiskTable />}

      {/* Slide-over for viewing/editing an existing supporter */}
      <SupporterSlideOver
        supporterId={selectedId}
        onClose={() => setSelectedId(null)}
        onSaved={handleSaved}
      />

      {/* Modal for creating a new supporter */}
      {showCreateForm && (
        <div className="modal-backdrop" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <SupporterForm
              supporter={null}
              onClose={() => setShowCreateForm(false)}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
