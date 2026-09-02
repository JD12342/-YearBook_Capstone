import { Card } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Input } from '../../components/ui/Input.jsx'

export function ExistingPhotos() {
  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Photos</div>
          <h2>Existing Photos</h2>
        </div>
      </div>

      <Card className="toolbar-card">
        <div className="filter-row">
          <div className="filter-field">
            <label>School Year</label>
            <Select>
              <option>2026-2027</option>
            </Select>
          </div>
          <div className="filter-field">
            <label>Strand</label>
            <Select>
              <option>STEM</option>
            </Select>
          </div>
          <div className="filter-field">
            <label>Optional Section</label>
            <Select>
              <option>All</option>
            </Select>
          </div>
          <div className="filter-field">
            <label>Student</label>
            <Input placeholder="Select student" />
          </div>
        </div>
      </Card>

      <Card className="panel-card upload-card">
        <div className="upload-box">
          <div className="upload-title">Upload Existing Photo</div>
          <p>JPG, JPEG, PNG accepted. The photo will be queued for review without opening the editor immediately.</p>
          <label className="upload-button">
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" />
            <span>Choose file</span>
          </label>
        </div>
      </Card>
    </div>
  )
}
