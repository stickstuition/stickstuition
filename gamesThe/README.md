# SQUADSUM on Sticks Tuition

This directory contains the standalone SQUADSUM source, player data, player images, club crests, and the checked-in browser build served at `/gamesThe/`.

The sound effects are generated locally with the Web Audio API, so the game does not fetch audio from another host.

For local game development, run `npm install` and `npm run dev` in this directory. After a source change, run `npm run build` and replace the checked-in `build/` output with the generated files before running the website's root build.
