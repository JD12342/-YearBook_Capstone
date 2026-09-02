import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'

const defaultControls = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 100,
  temperature: 0,
  sharpness: 0,
  grayscale: false,
  rotate: 0,
  straighten: 0,
  crop: 0,
}

export function PhotoEditorPage() {
  const [settings, setSettings] = useState(defaultControls)
  const [history, setHistory] = useState([defaultControls])
  const [step, setStep] = useState(0)

  const filters = useMemo(
    () => ({
      filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale ? 1 : 0})`,
      transform: `rotate(${settings.rotate}deg)`,
    }),
    [settings],
  )

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    setHistory((prev) => [...prev, next])
    setStep((prev) => prev + 1)
  }

  const reset = () => {
    setSettings(defaultControls)
    setHistory([defaultControls])
    setStep(0)
  }

  const undo = () => {
    if (step <= 0) return
    const nextStep = step - 1
    setStep(nextStep)
    setSettings(history[nextStep])
  }

  const redo = () => {
    if (step >= history.length - 1) return
    const nextStep = step + 1
    setStep(nextStep)
    setSettings(history[nextStep])
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Photos</div>
          <h2>Photo Editor</h2>
        </div>
      </div>

      <Card className="panel-card editor-layout">
        <div className="editor-stage">
          <div className="editor-photo-wrap">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"
              alt="Student portrait"
              style={{
                filter: filters.filter,
                transform: filters.transform,
              }}
            />
          </div>
          <div className="comparison-bar">
            <span>Original</span>
            <span>Edited</span>
          </div>
        </div>

        <div className="editor-controls">
          <div className="editor-actions">
            <Button variant="secondary" onClick={undo}>Undo</Button>
            <Button variant="secondary" onClick={redo}>Redo</Button>
            <Button variant="ghost" onClick={reset}>Reset</Button>
          </div>

          <div className="control-list">
            <label>Brightness <strong>{settings.brightness}%</strong></label>
            <input type="range" min="0" max="200" value={settings.brightness} onChange={(e) => updateSetting('brightness', Number(e.target.value))} />

            <label>Contrast <strong>{settings.contrast}%</strong></label>
            <input type="range" min="0" max="200" value={settings.contrast} onChange={(e) => updateSetting('contrast', Number(e.target.value))} />

            <label>Saturation <strong>{settings.saturation}%</strong></label>
            <input type="range" min="0" max="200" value={settings.saturation} onChange={(e) => updateSetting('saturation', Number(e.target.value))} />

            <label>Exposure <strong>{settings.exposure}%</strong></label>
            <input type="range" min="0" max="200" value={settings.exposure} onChange={(e) => updateSetting('exposure', Number(e.target.value))} />

            <label>Temperature <strong>{settings.temperature}</strong></label>
            <input type="range" min="-100" max="100" value={settings.temperature} onChange={(e) => updateSetting('temperature', Number(e.target.value))} />

            <label>Rotate <strong>{settings.rotate}°</strong></label>
            <input type="range" min="-180" max="180" value={settings.rotate} onChange={(e) => updateSetting('rotate', Number(e.target.value))} />

            <label>Straighten <strong>{settings.straighten}°</strong></label>
            <input type="range" min="-45" max="45" value={settings.straighten} onChange={(e) => updateSetting('straighten', Number(e.target.value))} />

            <label>
              <input type="checkbox" checked={settings.grayscale} onChange={(e) => updateSetting('grayscale', e.target.checked)} />
              Grayscale
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}
