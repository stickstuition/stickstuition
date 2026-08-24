import { Check, X } from "lucide-react";

export default function PlayerCard({ player, status, showNumber = false, showNames, showClubNames, answerReveal = false }) {
  return (
    <article className={`player-card ${status ? `player-card--${status}` : ""} ${answerReveal ? "player-card--answer" : ""}`} style={{ "--club-primary": player.teamPrimary, "--club-secondary": player.teamSecondary }}>
      <div className="player-card__topline"><span>{player.teamShortName}</span><img src={player.crest} alt="" /></div>
      <div className="player-card__portrait">
        <span className="player-card__halftone" aria-hidden="true" />
        <img src={player.image} alt={player.name} draggable="false" />
        {showNumber && <div className="squad-number-badge" aria-label={`Squad number ${player.squadNumber}`}><span>#</span>{player.squadNumber}</div>}
      </div>
      <div className="player-card__caption">
        {showNames ? <><strong>{player.firstName}</strong><strong>{player.secondName}</strong></> : <strong className="hidden-name">PLAYER</strong>}
        {showClubNames && <small>{player.teamName}</small>}
      </div>
      {status && <span className="card-status" aria-hidden="true">{status === "correct" ? <Check size={26} /> : <X size={26} />}</span>}
    </article>
  );
}
