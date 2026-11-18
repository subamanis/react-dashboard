# Dashboard

A React page of up to 25,000 metric cards, built to measure how a browser handles a large page.
It covers the first render, a re-render of every card on each frame, window resizes and scrolling.

React 19, TypeScript, CSS Modules, clsx, @tanstack/react-virtual and Vite 8.

Live at https://subamanis.github.io/react-dashboard/, built from `main` by the Pages workflow.

## Run

```bash
npm install
npm run dev
```

Measure the production build, since React runs extra checks in development.

```bash
npm run build
npm run preview
```

## The bar

The bar at the top stays pinned while the page scrolls.
On a narrow screen its controls wrap onto more lines.

- **cards** field sets the number of cards, from 1 to 25,000. A new value applies on Enter or when the field loses focus. An entry that is not a whole number goes back to the current count.
- **Grid** places the cards in rows of fixed width, wrapping at the window edge.
- **Masonry** places each card at the bottom of the shortest column. A browser with `display: grid-lanes` lays this out natively. In any other browser a script measures every card and positions it with a transform.
- **Live** changes the values of every card on every animation frame, so the whole page re-renders each frame.
- **clicks** counts the presses of the **Open** buttons on the cards.
- **content-visibility** gives every card `content-visibility: auto`, so the browser skips layout and paint of the cards outside the viewport. It works in Grid only and is greyed out in Masonry.
- **virtual** mounts only the cards near the viewport, with `useWindowVirtualizer` from @tanstack/react-virtual. It works in both layouts.
- **Performance** opens and closes the F2 panel, for a screen with no keyboard.

content-visibility and virtual exclude each other, and turning one on turns the other off.

The thin scrollbar on the right edge scrolls the page when its thumb is dragged. A click on its track centers the thumb on that spot.

## URL parameters

The same modes can be set in the address, for scripted runs such as [`?count=25000&layout=masonry&hud=1`](https://subamanis.github.io/react-dashboard/?count=25000&layout=masonry&hud=1).

| Parameter | Effect |
|---|---|
| `count=N` | number of cards, capped at 25,000 (10,000 by default) |
| `layout=masonry` | starts in Masonry |
| `live=1` | starts with Live on |
| `cv=1` | starts with content-visibility on |
| `virtual=1` | starts with virtual on, which wins over `cv=1` |
| `hud=1` | opens the F2 panel at load |

## F2 panel

F2 or the **Performance** toggle opens and closes a performance panel in the top right corner.
The frame rows update every 500 ms, and the counts also update after each click and resize.

| Row | Shows |
|---|---|
| FPS | frames per second, averaged over the last 500 ms |
| Frame avg / max | average and longest time between two frames over the same 500 ms |
| LoAF (>=50ms) | length of the last long frame, then script time (`js`), style and layout time (`lyt`) and count (`#n`) |
| Last click | time from a click to the end of its handlers (`js`) and of the next frame (`paint`) |
| Last resize | time from a window resize to the end of the next frame |
| Cards mounted | cards present in the DOM, which is all of them unless virtual is on |
| DOM elements | every element in the document |
| JS heap | used JavaScript heap in MB, in browsers that expose `performance.memory` |

The LoAF row needs the Long Animation Frames API and stays at 0 in a browser without it.
A long frame with no blocking time and under 1 ms of script and layout is left out.

## Font

The page uses Inter Regular from `public/fonts`, under the SIL Open Font License in `Inter-OFL.txt`.

## License

MIT, in `LICENSE`.
