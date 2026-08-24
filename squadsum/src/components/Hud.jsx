import { Home, Settings, Trophy, Volume2, VolumeX } from "lucide-react";

function HudButton({ label, onClick, children, disabled = false }) {
  return (
    <button
      className="hud-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function Hud({ screen, soundOn, onHome, onToggleSound, onSettings, onClick }) {
  return (
    <>
      <nav className="hud hud--left" aria-label="Game controls">
        {screen !== "menu" && (
          <HudButton label="Home" onClick={() => { onClick(); onHome(); }}>
            <Home size={22} strokeWidth={2.8} />
          </HudButton>
        )}
        <HudButton label={soundOn ? "Turn sound off" : "Turn sound on"} onClick={onToggleSound}>
          {soundOn ? <Volume2 size={22} strokeWidth={2.8} /> : <VolumeX size={22} strokeWidth={2.8} />}
        </HudButton>
        <HudButton label="Settings" onClick={() => { onClick(); onSettings(); }}>
          <Settings size={22} strokeWidth={2.8} />
        </HudButton>
      </nav>

      <div className="hud hud--right">
        <HudButton label="Trophies coming soon" disabled>
          <Trophy size={22} strokeWidth={2.8} />
        </HudButton>
        <div className="football-orb" aria-label="SQUADSUM football">
          <span>+</span>
        </div>
      </div>
    </>
  );
}
