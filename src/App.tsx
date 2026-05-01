import { useState } from 'react';
import titleBgPng from './assets/title-temple-night.png.png';
import titleBgSvg from './assets/title-temple-night.svg';
import { PhaserGame } from './game/PhaserGame';

type Screen = 'title' | 'battle';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const titleBg = `${`url(${titleBgPng})`}, ${`url(${titleBgSvg})`}`;

  return (
    <main className="app-shell">
      {screen === 'title' ? (
        <section className="title-page" style={{ backgroundImage: titleBg }}>
          <div className="title-overlay">
            <h1>《夜行荒庙》</h1>
            <p>荒庙夜深，符火未熄</p>
            <button onClick={() => setScreen('battle')}>开始游戏</button>
            <small className="build-badge">Images资源版 v2</small>
          </div>
        </section>
      ) : (
        <PhaserGame />
      )}
    </main>
  );
}
