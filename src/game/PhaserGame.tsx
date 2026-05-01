import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';

export function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: 900,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1b1f2a',
      scene: [BattleScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="game-container" ref={containerRef} />;
}
