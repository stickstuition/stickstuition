import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CornerDownLeft, Search, X } from "lucide-react";
import { generateQuestion, normalizePlayerName, playerMatchesGuess, pushRecent } from "../lib/game";
import PlayerCard from "./PlayerCard";
import Brand from "./Brand";

function MysteryCard({ question }) {
  return (
    <article
      className="player-card mystery-card"
      style={{ "--club-primary": question.left.teamPrimary, "--club-secondary": question.left.teamSecondary }}
      aria-label={`Mystery ${question.teamName} player`}
    >
      <div className="player-card__topline">
        <span>{question.left.teamShortName}</span>
        <img src={question.left.crest} alt="" />
      </div>
      <div className="mystery-card__portrait">
        <img src={question.left.crest} alt="" />
        <strong>?</strong>
      </div>
      <div className="player-card__caption mystery-card__caption">
        <strong>WHICH PLAYER?</strong>
        <small>{question.teamName}</small>
      </div>
    </article>
  );
}

export default function ClassroomGame({ players, selectedClubIds, difficulty, settings, onExit, onCorrect, onWrong }) {
  const [question, setQuestion] = useState(null);
  const [recent, setRecent] = useState([]);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(null);
  const inputRef = useRef(null);
  const lockedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const first = generateQuestion(players, selectedClubIds, difficulty);
    setQuestion(first);
    setRecent(first ? [first.key] : []);
    setAnswer("");
    setStatus(null);
    lockedRef.current = false;
    return () => window.clearTimeout(timeoutRef.current);
  }, [players, selectedClubIds, difficulty]);

  const teamPlayers = useMemo(
    () => players.filter((player) => player.playable && player.teamId === question?.teamId),
    [players, question?.teamId],
  );

  const suggestions = useMemo(() => {
    const query = normalizePlayerName(answer);
    if (!query || status) return [];
    return teamPlayers
      .filter((player) => normalizePlayerName(`${player.name} ${player.webName}`).includes(query))
      .sort((a, b) => {
        const aStarts = normalizePlayerName(a.webName).startsWith(query) ? 0 : 1;
        const bStarts = normalizePlayerName(b.webName).startsWith(query) ? 0 : 1;
        return aStarts - bStarts || b.popularity - a.popularity;
      })
      .slice(0, 5);
  }, [answer, status, teamPlayers]);

  useEffect(() => {
    if (!question) return;
    const next = generateQuestion(players, selectedClubIds, difficulty, recent);
    for (const player of [next?.left, next?.right, next?.answerPlayer]) {
      if (player?.image) new Image().src = player.image;
    }
  }, [players, selectedClubIds, difficulty, question, recent]);

  useEffect(() => {
    if (!status) inputRef.current?.focus();
  }, [question, status]);

  function advance() {
    const next = generateQuestion(players, selectedClubIds, difficulty, recent);
    if (!next) return;
    setRecent((current) => pushRecent(current, next.key));
    setQuestion(next);
    setAnswer("");
    setStatus(null);
    lockedRef.current = false;
  }

  function evaluateGuess(guess) {
    if (!question || lockedRef.current || !guess.trim()) return;
    if (playerMatchesGuess(question.answerPlayer, guess)) {
      lockedRef.current = true;
      setAnswer(question.answerPlayer.name);
      setStatus("correct");
      setScore((current) => current + 1);
      onCorrect();
      timeoutRef.current = window.setTimeout(advance, 1300);
    } else {
      lockedRef.current = true;
      setStatus("wrong");
      onWrong();
      timeoutRef.current = window.setTimeout(() => {
        setStatus(null);
        setAnswer("");
        lockedRef.current = false;
        inputRef.current?.focus();
      }, 650);
    }
  }

  function submit(event) {
    event.preventDefault();
    evaluateGuess(answer);
  }

  if (!question) {
    return (
      <div className="not-enough">
        <Brand compact />
        <h1>Not enough matching squad numbers for this selection.</h1>
        <button className="primary-button" type="button" onClick={onExit}>CHANGE CLUBS</button>
      </div>
    );
  }

  return (
    <div className={`screen screen--game ${status === "wrong" ? "is-shaking" : ""}`}>
      <header className="game-header">
        <Brand compact />
        <div className="scoreboard"><span>SCORE</span><strong>{String(score).padStart(2, "0")}</strong></div>
        <button type="button" className="exit-button" onClick={onExit}>EXIT</button>
      </header>

      <div className="question-area">
        <div className="question-club"><img src={question.left.crest} alt="" /><span>{question.teamName.toUpperCase()} QUESTION</span></div>
        <p className="round-label">SOLVE THE SQUAD NUMBERS, THEN NAME THE PLAYER</p>

        <div className="equation-row">
          <PlayerCard player={question.left} status={status} showNumber showNames={settings.showNames} showClubNames={settings.showClubNames} />
          <div className="operator" aria-label={question.operator === "+" ? "plus" : "minus"}>{question.operator}</div>
          <PlayerCard player={question.right} status={status} showNumber showNames={settings.showNames} showClubNames={settings.showClubNames} />
          <div className="operator operator--equals" aria-label="equals">=</div>
          {status === "correct" ? (
            <PlayerCard player={question.answerPlayer} status="correct" showNumber showNames showClubNames={settings.showClubNames} answerReveal />
          ) : <MysteryCard question={question} />}
        </div>

        <form className="answer-form" onSubmit={submit}>
          <div className="answer-form__input-wrap">
            {suggestions.length > 0 && (
              <div className="answer-suggestions" role="listbox" aria-label={`${question.teamName} players`}>
                {suggestions.map((player) => (
                  <button key={player.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => evaluateGuess(player.name)}>
                    <img src={player.image} alt="" /><span>{player.name}</span>
                  </button>
                ))}
              </div>
            )}
            <Search size={19} aria-hidden="true" className="answer-search-icon" />
            <input ref={inputRef} type="text" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="ENTER PLAYER NAME" aria-label={`Enter the name of the ${question.teamName} player wearing the answer number`} disabled={Boolean(status)} autoComplete="off" spellCheck="false" />
            <CornerDownLeft size={20} aria-hidden="true" className="answer-enter-icon" />
          </div>
          <button type="submit" className="submit-button" disabled={!answer.trim() || Boolean(status)}>SUBMIT</button>
        </form>

        <div className={`feedback ${status ? `feedback--${status}` : ""}`} role="status" aria-live="polite">
          {status === "correct" && <><Check size={23} /><strong>CORRECT!</strong><span>{question.left.squadNumber} {question.operator} {question.right.squadNumber} = {question.answerPlayer.squadNumber} · {question.answerPlayer.name}</span></>}
          {status === "wrong" && <><X size={23} /><strong>TRY AGAIN</strong><span>Choose another {question.teamName} player.</span></>}
          {!status && <span>Start typing a {question.teamName} player, then press ENTER</span>}
        </div>
      </div>
    </div>
  );
}
