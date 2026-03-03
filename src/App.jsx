import { useState, useEffect, useRef } from "react";

const STATUSES = [
  { id: "wishlist", label: "Wishlist", color: "#8B8FA3", bg: "#F0F0F4" },
  { id: "applied", label: "Applied", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "oa", label: "OA/Assessment", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "interview", label: "Interview", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "offer", label: "Offer", color: "#10B981", bg: "#ECFDF5" },
  { id: "rejected", label: "Rejected", color: "#EF4444", bg: "#FEF2F2" },
  { id: "withdrawn", label: "Withdrawn", color: "#6B7280", bg: "#F3F4F6" },
];

const PRIORITIES = [
  { id: "high", label: "High", color: "#EF4444" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "low", label: "Low", color: "#6B7280" },
];

const TYPES = ["Internship", "Full-time", "Part-time", "Contract", "Co-op"];

const EMPTY_APP = {
  id: "",
  company: "",
  role: "",
  type: "Internship",
  status: "wishlist",
  priority: "medium",
  location: "",
  url: "",
  salary: "",
  dateApplied: "",
  deadline: "",
  contactName: "",
  contactEmail: "",
  notes: "",
  interviewDate: "",
  createdAt: "",
  updatedAt: "",
};

const STORAGE_KEY = "app-tracker-data";

export default function ApplicationTracker() {
  const [apps, setApps] = useState([]);
  const [view, setView] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_APP });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const result = localStorage.getItem(STORAGE_KEY);
      if (result) {
        setApps(JSON.parse(result));
      }
    } catch (e) {
      console.error("Failed to load:", e);
      setApps([]);
    }
    setLoading(false);
  };

  const saveData = (newApps) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newApps));
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    let newApps;
    if (editingApp) {
      newApps = apps.map((a) =>
        a.id === editingApp.id ? { ...formData, updatedAt: now } : a
      );
    } else {
      const newApp = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      newApps = [newApp, ...apps];
    }
    setApps(newApps);
    saveData(newApps);
    closeModal();
  };

  const handleDelete = (id) => {
    const newApps = apps.filter((a) => a.id !== id);
    setApps(newApps);
    saveData(newApps);
    setDeleteConfirm(null);
    setExpandedCard(null);
  };

  const quickStatusChange = (id, newStatus) => {
    const now = new Date().toISOString();
    const newApps = apps.map((a) =>
      a.id === id ? { ...a, status: newStatus, updatedAt: now } : a
    );
    setApps(newApps);
    saveData(newApps);
  };

  const openModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({ ...app });
    } else {
      setEditingApp(null);
      setFormData({ ...EMPTY_APP });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingApp(null);
    setFormData({ ...EMPTY_APP });
  };

  const filtered = apps
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchPriority =
        filterPriority === "all" || a.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      let va = a[sortBy] || "";
      let vb = b[sortBy] || "";
      if (sortDir === "asc") return va < vb ? -1 : va > vb ? 1 : 0;
      return va > vb ? -1 : va < vb ? 1 : 0;
    });

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.id] = apps.filter((a) => a.status === s.id).length;
    return acc;
  }, {});

  const getStatus = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
  const getPriority = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

  const formatDate = (d) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelative = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(d);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.loadingSpinner} />
        <p style={{ color: "#8B8FA3", marginTop: 16, fontFamily: "'DM Sans', sans-serif" }}>Loading your applications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        tr:hover { background: #FAFAFE !important; }
        .board-card:hover { border-color: #D0D0D8 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important; }
        select:focus, input:focus, textarea:focus { border-color: #3B82F6 !important; }
        button:hover { opacity: 0.85; }
        .del-btn:hover { color: #EF4444 !important; }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#3B82F6" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#8B5CF6" opacity="0.7" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#10B981" opacity="0.7" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#F59E0B" opacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>Application Tracker</h1>
            <p style={styles.subtitle}>{apps.length} application{apps.length !== 1 ? "s" : ""} tracked</p>
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => openModal()}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Application
        </button>
      </header>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterStatus(filterStatus === s.id ? "all" : s.id)}
            style={{
              ...styles.statChip,
              background: filterStatus === s.id ? s.color : s.bg,
              color: filterStatus === s.id ? "#fff" : s.color,
              borderColor: filterStatus === s.id ? s.color : "transparent",
            }}
          >
            <span style={styles.statCount}>{statusCounts[s.id] || 0}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8FA3" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            style={styles.searchInput}
            placeholder="Search company, role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button style={styles.clearSearch} onClick={() => setSearchQuery("")}>&times;</button>
          )}
        </div>
        <div style={styles.toolbarRight}>
          <select
            style={styles.filterSelect}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            style={styles.filterSelect}
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-");
              setSortBy(field);
              setSortDir(dir);
            }}
          >
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="company-asc">Company A-Z</option>
            <option value="deadline-asc">Deadline Soonest</option>
          </select>
          <div style={styles.viewToggle}>
            {["table", "board", "cards"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  ...styles.viewBtn,
                  background: view === v ? "#1a1a2e" : "transparent",
                  color: view === v ? "#fff" : "#8B8FA3",
                }}
              >
                {v === "table" ? "\u2630" : v === "board" ? "\u229E" : "\u25A6"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>&#128203;</div>
            <h3 style={styles.emptyTitle}>
              {apps.length === 0 ? "No applications yet" : "No matching results"}
            </h3>
            <p style={styles.emptyText}>
              {apps.length === 0
                ? "Start tracking your internship applications by clicking the button above."
                : "Try adjusting your filters or search query."}
            </p>
            {apps.length === 0 && (
              <button style={{ ...styles.addBtn, margin: "0 auto" }} onClick={() => openModal()}>
                + Add First Application
              </button>
            )}
          </div>
        ) : view === "table" ? (
          <TableView
            apps={filtered}
            getStatus={getStatus}
            getPriority={getPriority}
            formatDate={formatDate}
            formatRelative={formatRelative}
            onEdit={openModal}
            onQuickStatus={quickStatusChange}
            onDelete={(id) => setDeleteConfirm(id)}
          />
        ) : view === "board" ? (
          <BoardView
            apps={filtered}
            allApps={apps}
            getStatus={getStatus}
            getPriority={getPriority}
            formatRelative={formatRelative}
            onEdit={openModal}
            onQuickStatus={quickStatusChange}
          />
        ) : (
          <CardsView
            apps={filtered}
            getStatus={getStatus}
            getPriority={getPriority}
            formatDate={formatDate}
            formatRelative={formatRelative}
            onEdit={openModal}
            expandedCard={expandedCard}
            setExpandedCard={setExpandedCard}
            onDelete={(id) => setDeleteConfirm(id)}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={styles.modal} ref={modalRef}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingApp ? "Edit Application" : "New Application"}
              </h2>
              <button style={styles.modalClose} onClick={closeModal}>&times;</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <FormField label="Company *">
                  <input
                    style={styles.input}
                    placeholder="e.g. Google"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </FormField>
                <FormField label="Role *">
                  <input
                    style={styles.input}
                    placeholder="e.g. Software Engineer Intern"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </FormField>
                <FormField label="Type">
                  <select
                    style={styles.input}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select
                    style={styles.input}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select
                    style={styles.input}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Location">
                  <input
                    style={styles.input}
                    placeholder="e.g. Singapore / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </FormField>
                <FormField label="Application URL" full>
                  <input
                    style={styles.input}
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </FormField>
                <FormField label="Salary / Stipend">
                  <input
                    style={styles.input}
                    placeholder="e.g. $30/hr"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </FormField>
                <FormField label="Date Applied">
                  <input
                    style={styles.input}
                    type="date"
                    value={formData.dateApplied}
                    onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                  />
                </FormField>
                <FormField label="Deadline">
                  <input
                    style={styles.input}
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </FormField>
                <FormField label="Interview Date">
                  <input
                    style={styles.input}
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  />
                </FormField>
                <FormField label="Contact Name">
                  <input
                    style={styles.input}
                    placeholder="Recruiter name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </FormField>
                <FormField label="Contact Email">
                  <input
                    style={styles.input}
                    placeholder="recruiter@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </FormField>
                <FormField label="Notes" full>
                  <textarea
                    style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
                    placeholder="Interview prep, referral info, timeline notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </FormField>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: formData.company && formData.role ? 1 : 0.5,
                }}
                disabled={!formData.company || !formData.role}
                onClick={handleSave}
              >
                {editingApp ? "Save Changes" : "Add Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: 0 }}>Delete Application?</h3>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "8px 0 20px", fontFamily: "'DM Sans', sans-serif" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                style={{ ...styles.saveBtn, background: "#EF4444" }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children, full = false }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function PriorityDot({ priority }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: priority.color, fontWeight: 500 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: priority.color, display: "inline-block" }} />
      {priority.label}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, display: "inline-block" }} />
      {status.label}
    </span>
  );
}

/* TABLE VIEW */
function TableView({ apps, getStatus, getPriority, formatDate, formatRelative, onEdit, onQuickStatus, onDelete }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Company", "Role", "Status", "Priority", "Type", "Location", "Applied", "Deadline", "Updated", ""].map((h, i) => (
              <th key={i} style={{ ...styles.th, ...(i === 9 ? { width: 50 } : {}) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => {
            const st = getStatus(app.status);
            const pr = getPriority(app.priority);
            const deadlineSoon = app.deadline && (new Date(app.deadline) - Date.now()) < 3 * 86400000 && (new Date(app.deadline) - Date.now()) > 0;
            return (
              <tr key={app.id} style={styles.tr} onClick={() => onEdit(app)}>
                <td style={{ ...styles.td, fontWeight: 600, color: "#1a1a2e" }}>{app.company}</td>
                <td style={styles.td}>{app.role}</td>
                <td style={styles.td}>
                  <select
                    style={{ ...styles.inlineSelect, background: st.bg, color: st.color }}
                    value={app.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); onQuickStatus(app.id, e.target.value); }}
                  >
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td style={styles.td}><PriorityDot priority={pr} /></td>
                <td style={{ ...styles.td, color: "#6B7280" }}>{app.type}</td>
                <td style={{ ...styles.td, color: "#6B7280" }}>{app.location || "\u2014"}</td>
                <td style={{ ...styles.td, color: "#6B7280" }}>{formatDate(app.dateApplied)}</td>
                <td style={{ ...styles.td, color: deadlineSoon ? "#EF4444" : "#6B7280", fontWeight: deadlineSoon ? 600 : 400 }}>
                  {formatDate(app.deadline)}
                </td>
                <td style={{ ...styles.td, color: "#8B8FA3", fontSize: 12 }}>{formatRelative(app.updatedAt)}</td>
                <td style={styles.td}>
                  <button
                    className="del-btn"
                    style={styles.deleteIconBtn}
                    onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
                    title="Delete"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* BOARD VIEW */
function BoardView({ apps, allApps, getStatus, getPriority, formatRelative, onEdit, onQuickStatus }) {
  return (
    <div style={styles.board}>
      {STATUSES.map((status) => {
        const col = allApps.filter((a) => a.status === status.id);
        const filteredCol = apps.filter((a) => a.status === status.id);
        return (
          <div key={status.id} style={styles.boardCol}>
            <div style={styles.boardColHeader}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: status.color }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{status.label}</span>
              </span>
              <span style={styles.boardCount}>{col.length}</span>
            </div>
            <div style={styles.boardCards}>
              {filteredCol.map((app) => {
                const pr = getPriority(app.priority);
                return (
                  <div key={app.id} className="board-card" style={styles.boardCard} onClick={() => onEdit(app)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", lineHeight: 1.3 }}>{app.company}</span>
                      <PriorityDot priority={pr} />
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{app.role}</span>
                    {app.location && <span style={{ fontSize: 11, color: "#8B8FA3", marginTop: 4 }}>{app.location}</span>}
                    <span style={{ fontSize: 11, color: "#C4C4C4", marginTop: 4 }}>{formatRelative(app.updatedAt)}</span>
                  </div>
                );
              })}
              {filteredCol.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#D0D0D8", fontSize: 12 }}>No applications</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* CARDS VIEW */
function CardsView({ apps, getStatus, getPriority, formatDate, formatRelative, onEdit, expandedCard, setExpandedCard, onDelete }) {
  return (
    <div style={styles.cardsGrid}>
      {apps.map((app) => {
        const st = getStatus(app.status);
        const pr = getPriority(app.priority);
        const isExpanded = expandedCard === app.id;
        return (
          <div key={app.id} style={{ ...styles.card, borderTop: `3px solid ${st.color}`, animation: "fadeIn 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={styles.cardCompany}>{app.company}</h4>
                <p style={styles.cardRole}>{app.role}</p>
              </div>
              <StatusBadge status={st} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <PriorityDot priority={pr} />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{app.type}</span>
              {app.location && <span style={{ fontSize: 12, color: "#6B7280" }}>{app.location}</span>}
            </div>
            {isExpanded && (
              <div style={styles.cardExpanded}>
                {app.dateApplied && <DetailRow label="Applied" value={formatDate(app.dateApplied)} />}
                {app.deadline && <DetailRow label="Deadline" value={formatDate(app.deadline)} />}
                {app.interviewDate && <DetailRow label="Interview" value={formatDate(app.interviewDate)} />}
                {app.salary && <DetailRow label="Salary" value={app.salary} />}
                {app.contactName && <DetailRow label="Contact" value={`${app.contactName}${app.contactEmail ? ` \u2022 ${app.contactEmail}` : ""}`} />}
                {app.url && <DetailRow label="URL" value={app.url} isLink />}
                {app.notes && (
                  <div style={{ marginTop: 4 }}>
                    <span style={styles.cardDetailLabel}>Notes</span>
                    <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, margin: "4px 0 0" }}>{app.notes}</p>
                  </div>
                )}
              </div>
            )}
            <div style={styles.cardFooter}>
              <span style={{ fontSize: 11, color: "#8B8FA3" }}>{formatRelative(app.updatedAt)}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={styles.cardActionBtn} onClick={() => setExpandedCard(isExpanded ? null : app.id)}>
                  {isExpanded ? "\u25B4 Less" : "\u25BE More"}
                </button>
                <button style={styles.cardActionBtn} onClick={() => onEdit(app)}>Edit</button>
                <button style={{ ...styles.cardActionBtn, color: "#EF4444" }} onClick={() => onDelete(app.id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, isLink }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "baseline" }}>
      <span style={styles.cardDetailLabel}>{label}</span>
      {isLink ? <span style={{ color: "#3B82F6", wordBreak: "break-all" }}>{value}</span> : <span>{value}</span>}
    </div>
  );
}

/* STYLES */
const styles = {
  container: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#F8F8FC",
    minHeight: "100vh",
    color: "#1a1a2e",
    padding: "0 0 40px",
  },
  loadingScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#F8F8FC",
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    border: "3px solid #E5E7EB",
    borderTopColor: "#3B82F6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    background: "#fff",
    borderBottom: "1px solid #EEEEF2",
    flexWrap: "wrap",
    gap: 16,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#F0F0F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: { margin: 0, fontSize: 13, color: "#8B8FA3" },
  addBtn: {
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
  },
  statsRow: {
    display: "flex",
    gap: 8,
    padding: "16px 32px",
    overflowX: "auto",
    flexWrap: "wrap",
  },
  statChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1.5px solid transparent",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  statCount: { fontWeight: 700, fontSize: 14 },
  statLabel: { fontWeight: 500 },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px 16px",
    gap: 12,
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: "1.5px solid #EEEEF2",
    borderRadius: 10,
    padding: "8px 14px",
    flex: "1 1 280px",
    maxWidth: 420,
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 14,
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "transparent",
  },
  clearSearch: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "#8B8FA3",
    padding: "0 2px",
  },
  toolbarRight: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  filterSelect: {
    padding: "8px 12px",
    border: "1.5px solid #EEEEF2",
    borderRadius: 10,
    background: "#fff",
    fontSize: 13,
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    outline: "none",
  },
  viewToggle: {
    display: "flex",
    background: "#F0F0F4",
    borderRadius: 8,
    overflow: "hidden",
  },
  viewBtn: {
    border: "none",
    padding: "7px 12px",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  content: { padding: "0 32px" },
  emptyState: { textAlign: "center", padding: "80px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    fontWeight: 400,
    margin: "0 0 8px",
  },
  emptyText: { color: "#8B8FA3", fontSize: 14, margin: "0 0 24px" },

  /* TABLE */
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #EEEEF2", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#FAFAFE",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#8B8FA3",
    borderBottom: "1px solid #EEEEF2",
    whiteSpace: "nowrap",
  },
  tr: { cursor: "pointer" },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #F5F5F8",
    whiteSpace: "nowrap",
    fontSize: 13,
    color: "#374151",
  },
  inlineSelect: {
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  },
  deleteIconBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#C4C4C4",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 4,
    lineHeight: 1,
  },

  /* BOARD */
  board: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 8,
  },
  boardCol: {
    minWidth: 220,
    flex: "1 0 220px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #EEEEF2",
    display: "flex",
    flexDirection: "column",
  },
  boardColHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #EEEEF2",
  },
  boardCount: {
    background: "#F0F0F4",
    borderRadius: 10,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: "#8B8FA3",
  },
  boardCards: { padding: 8, display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  boardCard: {
    padding: "12px 14px",
    background: "#FAFAFE",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    border: "1px solid transparent",
    transition: "all 0.15s",
  },

  /* CARDS */
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "18px 20px",
    border: "1px solid #EEEEF2",
    display: "flex",
    flexDirection: "column",
  },
  cardCompany: { margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" },
  cardRole: { margin: "2px 0 0", fontSize: 13, color: "#6B7280" },
  cardExpanded: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid #EEEEF2",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardDetailLabel: { fontWeight: 600, fontSize: 11, textTransform: "uppercase", color: "#8B8FA3", minWidth: 70 },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTop: "1px solid #F5F5F8",
  },
  cardActionBtn: {
    background: "none",
    border: "none",
    fontSize: 12,
    fontWeight: 500,
    color: "#6B7280",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif",
  },

  /* MODAL */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(26,26,46,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 640,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #EEEEF2",
  },
  modalTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    fontWeight: 400,
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#8B8FA3",
    padding: "0 4px",
    lineHeight: 1,
  },
  modalBody: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #EEEEF2",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
    background: "#FAFAFE",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 24px",
    borderTop: "1px solid #EEEEF2",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "1.5px solid #EEEEF2",
    background: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    color: "#6B7280",
  },
  saveBtn: {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: "#1a1a2e",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  deleteModal: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
};
