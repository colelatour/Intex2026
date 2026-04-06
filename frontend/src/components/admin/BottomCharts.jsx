// src/components/admin/BottomCharts.jsx

const EVENTS = [
  { date: 'Apr 7',  title: 'Case Conference',       house: 'House A' },
  { date: 'Apr 9',  title: 'Home Visitation',       house: 'House B' },
  { date: 'Apr 10', title: 'Routine Follow-up',     house: 'House C' },
  { date: 'Apr 12', title: 'Reintegration Assess.', house: 'House A' },
];

export default function BottomCharts() {
  return (
    <div className="bottom-grid">
      {/* Donation Trends */}
      <div className="admin-card">
        <h4>
          Donation Trends
          <span className="admin-card__link">Details →</span>
        </h4>
        <div className="chart-placeholder">[Bar / Line Chart — Monthly Donations]</div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--navy)' }} />
            Monthly
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--orange)' }} />
            At Risk
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--gold)' }} />
            Year-to-Date
          </div>
        </div>
      </div>

      {/* Resident Outcomes */}
      <div className="admin-card">
        <h4>
          Resident Outcomes
          <span className="admin-card__link">Details →</span>
        </h4>
        <div className="chart-placeholder">[Donut Chart — Status Breakdown]</div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--gold)' }} />
            Progressing
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--orange)' }} />
            Monitoring
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--red)' }} />
            At Risk
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--blue)' }} />
            Reintegrated
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="admin-card">
        <h4>
          Upcoming Events
          <span className="admin-card__link">Calendar →</span>
        </h4>
        {EVENTS.map((e) => (
          <div className="event-item" key={e.date + e.title}>
            <div className="event-date">{e.date}</div>
            <div className="event-info">
              <h5>{e.title}</h5>
              <p>{e.house}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
