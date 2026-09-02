export function AcademicTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="academic-tabs" role="tablist" aria-label="Academic management tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          className={`academic-tab ${activeTab === tab.value ? 'active' : ''}`.trim()}
          onClick={() => onChange?.(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
