import { useState } from 'react';
import { PhaserGame } from './game/PhaserGame';

type Screen = 'title' | 'battle';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');

  return (
    <main className="app-shell">
      {screen === 'title' ? (
        <section className="title-page">
          <h1>夜行荒庙</h1>
          <button onClick={() => setScreen('battle')}>开始游戏</button>
        </section>
      ) : (
        <PhaserGame />
      )}
    </main>
  );
}
