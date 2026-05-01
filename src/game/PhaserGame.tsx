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
      width: 1920,
      height: 1080,
      parent: containerRef.current,
      backgroundColor: '#09070f',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
      },
      render: {
        antialias: true,
        roundPixels: false,
      },
      // Phaser typings omit resolution in some versions; keep runtime DPI cap.
      ...( { resolution: Math.min(window.devicePixelRatio || 1, 2) } as unknown as object ),
      scene: [BattleScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="game-container" ref={containerRef} />;
}
