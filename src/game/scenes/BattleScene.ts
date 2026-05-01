import Phaser from 'phaser';

type Card = {
  name: string;
  description: string;
  damage?: number;
  armor?: number;
};

export class BattleScene extends Phaser.Scene {
  private playerHp = 30;
  private playerArmor = 0;
  private enemyHp = 24;
  private readonly enemyDamage = 7;

  private readonly cards: Card[] = [
    { name: '斩击', description: '造成6点伤害', damage: 6 },
    { name: '护身符', description: '获得5点护甲', armor: 5 },
    { name: '火符', description: '造成10点伤害', damage: 10 },
  ];

  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('battle-scene');
  }

  create() {
    this.add.text(40, 20, '战斗场景', { fontSize: '28px', color: '#ffffff' });
    this.add.text(120, 120, '玩家', { fontSize: '24px', color: '#8be9fd' });
    this.add.text(650, 120, '敌人', { fontSize: '24px', color: '#ff6b6b' });

    this.playerStatusText = this.add.text(80, 170, '', { fontSize: '22px', color: '#ffffff' });
    this.enemyStatusText = this.add.text(620, 170, '', { fontSize: '22px', color: '#ffffff' });
    this.messageText = this.add.text(350, 250, '', { fontSize: '28px', color: '#ffd166' });

    this.renderCards();
    this.renderEndTurnButton();
    this.updateStatus();
  }

  private renderCards() {
    this.cards.forEach((card, index) => {
      const x = 120 + index * 250;
      const y = 420;

      const cardRect = this.add
        .rectangle(x, y, 200, 130, 0x33415c)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });

      this.add.text(x - 80, y - 45, card.name, { fontSize: '24px', color: '#ffffff' });
      this.add.text(x - 80, y - 5, card.description, { fontSize: '18px', color: '#f1f5f9' });

      cardRect.on('pointerdown', () => this.playCard(card));
    });
  }

  private renderEndTurnButton() {
    const button = this.add
      .rectangle(780, 540, 180, 48, 0x6c757d)
      .setInteractive({ useHandCursor: true });

    this.add.text(710, 525, '结束回合', { fontSize: '24px', color: '#ffffff' });

    button.on('pointerdown', () => this.endTurn());
  }

  private playCard(card: Card) {
    if (this.isCombatOver()) return;

    if (card.damage) {
      this.enemyHp = Math.max(0, this.enemyHp - card.damage);
    }

    if (card.armor) {
      this.playerArmor += card.armor;
    }

    this.updateStatus();
    this.checkCombatResult();
  }

  private endTurn() {
    if (this.isCombatOver()) return;

    const damageAfterArmor = Math.max(0, this.enemyDamage - this.playerArmor);
    this.playerArmor = Math.max(0, this.playerArmor - this.enemyDamage);
    this.playerHp = Math.max(0, this.playerHp - damageAfterArmor);

    this.updateStatus();
    this.checkCombatResult();
  }

  private checkCombatResult() {
    if (this.enemyHp <= 0) {
      this.messageText.setText('战斗胜利');
    } else if (this.playerHp <= 0) {
      this.messageText.setText('失败');
    }
  }

  private updateStatus() {
    this.playerStatusText.setText(`玩家血量: ${this.playerHp} 护甲: ${this.playerArmor}`);
    this.enemyStatusText.setText(`敌人血量: ${this.enemyHp}`);
  }

  private isCombatOver() {
    return this.enemyHp <= 0 || this.playerHp <= 0;
  }
}
