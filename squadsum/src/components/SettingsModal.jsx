import { Volume2, X } from "lucide-react";

function SettingRow({ title, description, enabled, onToggle }) {
  return (
    <div className="setting-row">
      <div><strong>{title}</strong><small>{description}</small></div>
      <button
        type="button"
        className={`toggle ${enabled ? "is-on" : ""}`}
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={`Turn ${title.toLowerCase()} ${enabled ? "off" : "on"}`}
      >
        <span />
      </button>
    </div>
  );
}

export default function SettingsModal({ settings, setSettings, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header>
          <div className="modal-title-icon"><Volume2 size={22} /></div>
          <div><p>GAME OPTIONS</p><h2 id="settings-title">Settings</h2></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close settings"><X /></button>
        </header>
        <SettingRow
          title="Sound"
          description="Button and answer feedback"
          enabled={settings.soundOn}
          onToggle={() => setSettings((current) => ({ ...current, soundOn: !current.soundOn }))}
        />
        <SettingRow
          title="Player names"
          description="Show names below each face"
          enabled={settings.showNames}
          onToggle={() => setSettings((current) => ({ ...current, showNames: !current.showNames }))}
        />
        <SettingRow
          title="Club names"
          description="Show each player's club"
          enabled={settings.showClubNames}
          onToggle={() => setSettings((current) => ({ ...current, showClubNames: !current.showClubNames }))}
        />
        <button className="modal-done" type="button" onClick={onClose}>DONE</button>
      </section>
    </div>
  );
}
