import { useEffect, useMemo, useState } from "react";
import Backdrop from "./components/Backdrop";
import Hud from "./components/Hud";
import MainMenu from "./components/MainMenu";
import ClassroomSetup from "./components/ClassroomSetup";
import ClassroomGame from "./components/ClassroomGame";
import SettingsModal from "./components/SettingsModal";
import ConfirmModal from "./components/ConfirmModal";
import rawClubs from "./data/clubs.json";
import rawPlayers from "./data/players.json";
import { getSavedSound, playSound, saveSound } from "./lib/sound";

const SETTINGS_KEY = "squadsum:settings";
const GAME_BASE = "/gamesThe";

const gameAsset = (assetPath) => `${GAME_BASE}${assetPath}`;
const clubs = rawClubs.map((club) => ({ ...club, crest: gameAsset(club.crest) }));
const players = rawPlayers.map((player) => ({ ...player, image: gameAsset(player.image) }));

function initialSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return {
      soundOn: getSavedSound(),
      showNames: saved?.showNames ?? true,
      showClubNames: saved?.showClubNames ?? true,
    };
  } catch {
    return { soundOn: true, showNames: true, showClubNames: true };
  }
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [selectedClubIds, setSelectedClubIds] = useState(clubs.map((club) => club.id));
  const [difficulty, setDifficulty] = useState("easy");
  const [settings, setSettings] = useState(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const enrichedPlayers = useMemo(() => {
    const clubMap = new Map(clubs.map((club) => [club.id, club]));
    return players.map((player) => {
      const club = clubMap.get(player.teamId);
      return {
        ...player,
        crest: club?.crest,
        teamPrimary: club?.primary,
        teamSecondary: club?.secondary,
        teamShortName: club?.shortName,
      };
    });
  }, []);

  useEffect(() => {
    saveSound(settings.soundOn);
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ showNames: settings.showNames, showClubNames: settings.showClubNames }),
    );
  }, [settings]);

  const click = () => playSound("click", settings.soundOn);
  const requestHome = () => {
    if (screen === "game") setConfirmOpen(true);
    else setScreen("menu");
  };

  return (
    <Backdrop>
      <Hud
        screen={screen}
        soundOn={settings.soundOn}
        onHome={requestHome}
        onToggleSound={() => setSettings((current) => ({ ...current, soundOn: !current.soundOn }))}
        onSettings={() => setSettingsOpen(true)}
        onClick={click}
      />

      {screen === "menu" && <MainMenu clubs={clubs} onClassroom={() => setScreen("setup")} onClick={click} />}
      {screen === "setup" && (
        <ClassroomSetup
          clubs={clubs}
          players={enrichedPlayers}
          selectedClubIds={selectedClubIds}
          setSelectedClubIds={setSelectedClubIds}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onBack={() => setScreen("menu")}
          onStart={() => setScreen("game")}
          onClick={click}
        />
      )}
      {screen === "game" && (
        <ClassroomGame
          players={enrichedPlayers}
          selectedClubIds={selectedClubIds}
          difficulty={difficulty}
          settings={settings}
          onExit={() => setConfirmOpen(true)}
          onCorrect={() => playSound("correct", settings.soundOn)}
          onWrong={() => playSound("wrong", settings.soundOn)}
        />
      )}

      {settingsOpen && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setSettingsOpen(false)} />}
      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); setScreen("menu"); }}
        />
      )}
    </Backdrop>
  );
}
