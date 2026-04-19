# SAPF 2 Juice Stream Overlay Component

This stream overlay is a locally hosted website that renders two pillars on the left and right side of the screen resembling the four flavours of juice (also called "SAPF") that the [SAPF e-sports tournament series](https://www.start.gg/sapf) uses as a playful engagement mechanic.

This overlay was built for and used as part of the main stream production for [SAPF 2](https://www.start.gg/tournament/sapf-2) which was produced by [Team Phoenix](https://www.youtube.com/@teamphoenix5863).

Features:

- uses HTML `<canvas>` rendering with the p5.js library and is built into HTML and JavaScript files which can be added to most streaming software using a browser source
- idle animation resembling calm waves
- particle system to have bubbles rising up to the surface
- polls Team Phoenix' stream system to display juice flavor/color that matches what the player on that side of the stream picked when they registered for the tournament
- juice pillar rises or falls depending on the current score of a player with a smooth transition

## Screenshot in production

![Screenshot of SAPF 2 stream overlay](./docs/SAPF%202%20Day%203%205-44-4%20screenshot.png)

Source: https://youtu.be/jIGK-_0NihU / Team Phoenix YouTube Channel

## Video in production

This video shows the idle bubble and wave animation as well as the juice height animation when the score is changed.

Note that the the juice level animation is swiftly followed by a scene transition / animation which is part of the stream production and not this project.

<video src='https://github.com/FunctionDJ/sapf-juice-overlay/raw/refs/heads/main/docs/SAPF%202%20Day%203%20%5BjIGK-_0NihU%5D.webm' width=180/>

Source: https://youtu.be/jIGK-_0NihU / Team Phoenix YouTube Channel

## Development / standalone screenshot

![Screenshot of only the juice overlay without gameplay or other third-party overlay components](./docs/standalone%20screenshot.png)
