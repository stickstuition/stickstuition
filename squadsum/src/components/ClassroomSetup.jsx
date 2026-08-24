import { Check, ChevronLeft, Sparkles, Users } from "lucide-react";
import Brand from "./Brand";

export default function ClassroomSetup({
  clubs,
  players,
  selectedClubIds,
  setSelectedClubIds,
  difficulty,
  setDifficulty,
  onBack,
  onStart,
  onClick,
}) {
  const allSelected = selectedClubIds.length === clubs.length;
  const available = players.filter(
    (player) =>
      player.playable &&
      selectedClubIds.includes(player.teamId) &&
      (difficulty === "all" || player.easy),
  ).length;

  function toggleClub(id) {
    onClick();
    setSelectedClubIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((clubId) => clubId !== id);
      }
      return [...current, id];
    });
  }

  function selectAll() {
    onClick();
    setSelectedClubIds(clubs.map((club) => club.id));
  }

  return (
    <div className="screen screen--setup">
      <div className="setup-header">
        <button className="back-link" type="button" onClick={() => { onClick(); onBack(); }}>
          <ChevronLeft size={20} /> BACK
        </button>
        <Brand compact />
        <div className="setup-step">SETUP 01</div>
      </div>

      <div className="setup-scroll">
        <header className="setup-title">
          <p className="eyebrow">CLASSROOM MODE</p>
          <h1>Which players should appear?</h1>
          <p>Pick one club, a few rivals, or open the game to the whole league.</p>
        </header>

        <button
          type="button"
          className={`all-clubs ${allSelected ? "is-selected" : ""}`}
          onClick={selectAll}
        >
          <span className="all-clubs__icon"><Users size={26} /></span>
          <span><strong>ALL PREMIER LEAGUE</strong><small>Every club in the 2026/27 season</small></span>
          <span className="selection-check">{allSelected && <Check size={19} />}</span>
        </button>

        <div className="club-grid" aria-label="Choose clubs">
          {clubs.map((club) => {
            const active = selectedClubIds.includes(club.id);
            return (
              <button
                type="button"
                key={club.id}
                className={`club-tile ${active ? "is-selected" : ""}`}
                onClick={() => toggleClub(club.id)}
                aria-pressed={active}
                style={{ "--club-primary": club.primary }}
              >
                <img src={club.crest} alt="" />
                <span>{club.name}</span>
                <span className="selection-check">{active && <Check size={15} />}</span>
              </button>
            );
          })}
        </div>

        <div className="pool-section">
          <div>
            <p className="pool-label">PLAYER POOL</p>
            <p className="pool-help">Choose how familiar the faces should be.</p>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              className={difficulty === "easy" ? "is-active" : ""}
              onClick={() => { onClick(); setDifficulty("easy"); }}
            >
              <Sparkles size={17} /> EASY
            </button>
            <button
              type="button"
              className={difficulty === "all" ? "is-active" : ""}
              onClick={() => { onClick(); setDifficulty("all"); }}
            >
              <Users size={17} /> ALL PLAYERS
            </button>
          </div>
        </div>
      </div>

      <div className="setup-actions">
        <div className="player-count"><strong>{available}</strong> players ready</div>
        <button className="primary-button" type="button" onClick={() => { onClick(); onStart(); }} disabled={available < 2}>
          START GAME <span>›</span>
        </button>
      </div>
    </div>
  );
}
