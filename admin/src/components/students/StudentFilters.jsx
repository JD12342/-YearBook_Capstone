import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'

export function StudentFilters({
  schoolYears = [],
  strands = [],
  selectedSchoolYearId,
  selectedStrandId,
  selectedSectionId,
  statusFilter,
  searchTerm,
  onSchoolYearChange,
  onStrandChange,
  onSectionChange,
  onStatusChange,
  onSearchChange,
  sectionOptions = [],
}) {
  return (
    <div className="filter-row">
      <label className="filter-field">
        <span>School Year</span>
        <Select value={selectedSchoolYearId} onChange={onSchoolYearChange}>
          {schoolYears.map((year) => (
            <option key={year.id} value={year.id}>{year.name}</option>
          ))}
        </Select>
      </label>

      <label className="filter-field">
        <span>Strand</span>
        <Select value={selectedStrandId} onChange={onStrandChange}>
          <option value="">All strands</option>
          {strands.map((strand) => (
            <option key={strand.id} value={strand.id}>{strand.name}</option>
          ))}
        </Select>
      </label>

      <label className="filter-field">
        <span>Section</span>
        <Select value={selectedSectionId} onChange={onSectionChange}>
          <option value="">All sections</option>
          {sectionOptions.map((section) => (
            <option key={section} value={section}>{section}</option>
          ))}
        </Select>
      </label>

      <label className="filter-field">
        <span>Status</span>
        <Select value={statusFilter} onChange={onStatusChange}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="captured">Captured</option>
          <option value="editing">Editing</option>
          <option value="retake_needed">Retake needed</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </Select>
      </label>

      <label className="filter-field full-span">
        <span>Search</span>
        <Input value={searchTerm} onChange={onSearchChange} placeholder="Search by name or student number" />
      </label>
    </div>
  )
}
