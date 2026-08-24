export function pairKey(left, right) {
  return [left.id, right.id].sort((a, b) => a - b).join(":");
}

export function filterPlayers(players, selectedClubIds, difficulty) {
  const clubSet = new Set(selectedClubIds);
  return players.filter(
    (player) =>
      player.playable &&
      clubSet.has(player.teamId) &&
      (difficulty === "all" || player.easy),
  );
}

export function questionCandidates(teamPlayers) {
  const candidates = [];
  const byNumber = new Map(teamPlayers.map((player) => [player.squadNumber, player]));

  for (let i = 0; i < teamPlayers.length; i += 1) {
    for (let j = i + 1; j < teamPlayers.length; j += 1) {
      const first = teamPlayers[i];
      const second = teamPlayers[j];
      const key = `${first.teamId}:${pairKey(first, second)}`;

      const additionAnswer = byNumber.get(first.squadNumber + second.squadNumber);
      if (additionAnswer && additionAnswer.id !== first.id && additionAnswer.id !== second.id) {
        candidates.push({
          left: first,
          right: second,
          operator: "+",
          answerPlayer: additionAnswer,
          key,
          teamId: first.teamId,
          teamName: first.teamName,
        });
      }

      const [larger, smaller] = first.squadNumber > second.squadNumber
        ? [first, second]
        : [second, first];
      const subtractionAnswer = byNumber.get(larger.squadNumber - smaller.squadNumber);
      if (subtractionAnswer && subtractionAnswer.id !== larger.id && subtractionAnswer.id !== smaller.id) {
        candidates.push({
          left: larger,
          right: smaller,
          operator: "−",
          answerPlayer: subtractionAnswer,
          key,
          teamId: first.teamId,
          teamName: first.teamName,
        });
      }
    }
  }

  return candidates;
}

export function generateQuestion(players, selectedClubIds, difficulty = "easy", recentKeys = []) {
  const selected = new Set(selectedClubIds);
  const byTeam = new Map();

  for (const player of players) {
    if (!player.playable || !selected.has(player.teamId)) continue;
    if (!byTeam.has(player.teamId)) byTeam.set(player.teamId, []);
    byTeam.get(player.teamId).push(player);
  }

  const teamQuestions = [];
  for (const [teamId, teamPlayers] of byTeam) {
    const preferred = difficulty === "easy"
      ? teamPlayers.filter((player) => player.easy)
      : teamPlayers;
    let candidates = questionCandidates(preferred);
    if (!candidates.length && difficulty === "easy") {
      candidates = questionCandidates(teamPlayers);
    }
    if (candidates.length) teamQuestions.push({ teamId, candidates });
  }

  if (!teamQuestions.length) return null;
  const blocked = new Set(recentKeys);
  const freshTeams = teamQuestions
    .map((team) => ({ ...team, candidates: team.candidates.filter((question) => !blocked.has(question.key)) }))
    .filter((team) => team.candidates.length);
  const availableTeams = freshTeams.length ? freshTeams : teamQuestions;
  const chosenTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
  return chosenTeam.candidates[Math.floor(Math.random() * chosenTeam.candidates.length)];
}

export function normalizePlayerName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function playerMatchesGuess(player, guess) {
  const normalized = normalizePlayerName(guess);
  if (!normalized) return false;
  return [player.name, player.webName, `${player.firstName} ${player.secondName}`]
    .some((candidate) => normalizePlayerName(candidate) === normalized);
}

export function pushRecent(recentKeys, key, limit = 20) {
  return [...recentKeys, key].slice(-limit);
}
