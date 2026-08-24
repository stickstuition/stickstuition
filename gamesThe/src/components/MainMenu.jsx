import { LockKeyhole, Play } from "lucide-react";
import Brand from "./Brand";
import PanelTexture from "./PanelTexture";

function ModeButton({ title, description, active, onClick }) {
  return (
    <button
      type="button"
      className={`mode-button ${active ? "mode-button--active" : "mode-button--disabled"}`}
      onClick={onClick}
      disabled={!active}
    >
      <span className="mode-button__icon">
        {active ? <Play fill="currentColor" size={20} /> : <LockKeyhole size={19} />}
      </span>
      <span className="mode-button__copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="mode-button__chevron" aria-hidden="true">›</span>
    </button>
  );
}

export default function MainMenu({ clubs, onClassroom, onClick }) {
  return (
    <div className="screen screen--menu">
      <PanelTexture clubs={clubs} />
      <div className="menu-content">
        <p className="eyebrow">THE FOOTBALL MATHS GAME</p>
        <Brand />
        <p className="menu-tagline">Know the players. Add the numbers. Own the classroom.</p>

        <div className="mode-stack">
          <ModeButton title="TIMED MODE" description="COMING SOON" />
          <ModeButton
            title="CLASSROOM MODE"
            description="NO TIMER · ENDLESS PLAY"
            active
            onClick={() => { onClick(); onClassroom(); }}
          />
          <ModeButton title="ONLINE MODE" description="COMING SOON" />
        </div>
      </div>

      <footer className="menu-footer">
        <span>2026/27 PLAYER DATA</span>
        <span>UNOFFICIAL CLASSROOM FOOTBALL GAME</span>
      </footer>
    </div>
  );
}
