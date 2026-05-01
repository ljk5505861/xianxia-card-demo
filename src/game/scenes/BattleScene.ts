import Phaser from 'phaser';
import nightTempleBg from '../../assets/night-temple.svg';

type Card = {
  name: string;
  description: string;
  damage?: number;
  armor?: number;
};

export class BattleScene extends Phaser.Scene {
  private playerHp = 30;
  private playerArmor = 0;
  private enemyHp = 40;
  private readonly enemyDamage = 8;

  private readonly cards: Card[] = [
    { name: '斩击', description: '造成6点伤害', damage: 6 },
    { name: '护身符', description: '获得5点护甲', armor: 5 },
    { name: '火符', description: '造成10点伤害', damage: 10 },
  ];

  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private enemyIntentText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('battle-scene');
  }

  preload() {
    this.load.image('night-temple-bg', nightTempleBg);
  }

  create() {
    this.resetCombatState();
    this.drawBattleLayout();
    this.renderCards();
    this.renderEndTurnButton();
    this.updateStatus();
    this.messageText.setText('');
  }

  private resetCombatState() {
    this.playerHp = 30;
    this.playerArmor = 0;
    this.enemyHp = 40;
  }

  private drawBattleLayout() {
    this.add.image(450, 300, 'night-temple-bg').setDisplaySize(900, 600).setAlpha(0.95);
    this.add.rectangle(450, 300, 900, 600, 0x05030b, 0.38);
    this.add.rectangle(450, 280, 860, 520, 0x1a1232, 0.74).setStrokeStyle(2, 0x5f4b8b);

    this.add.text(60, 40, '荒庙夜巡', { fontSize: '30px', color: '#f7d794' });

    this.add.text(120, 120, '巡夜人', { fontSize: '26px', color: '#8be9fd' });
    this.add.text(660, 120, '庙中邪祟', { fontSize: '26px', color: '#ff9f9f' });

    this.add.circle(700, 240, 70, 0x2d1f4d, 0.85).setStrokeStyle(3, 0xbfa2db);
    this.add.rectangle(700, 240, 90, 120, 0x161022, 0.85).setStrokeStyle(2, 0x8e7cc3);

    this.playerStatusText = this.add.text(90, 180, '', { fontSize: '22px', color: '#ffffff' });
    this.enemyStatusText = this.add.text(610, 180, '', { fontSize: '22px', color: '#ffffff' });
    this.enemyIntentText = this.add.text(590, 320, `敌人意图：下回合造成 ${this.enemyDamage} 点伤害`, {
      fontSize: '20px',
      color: '#ffd166',
    });

    this.messageText = this.add.text(370, 360, '', { fontSize: '34px', color: '#ffeaa7' });
  }

  private renderCards() {
    this.cards.forEach((card, index) => {
      const x = 150 + index * 250;
      const y = 500;

      const cardRect = this.add
        .rectangle(x, y, 200, 150, 0x2a2242)
        .setStrokeStyle(3, 0xd6c0ff)
        .setInteractive({ useHandCursor: true });

      this.add.text(x - 78, y - 58, card.name, { fontSize: '24px', color: '#f8f5ff' });
      this.add.text(x - 78, y - 20, card.description, { fontSize: '18px', color: '#d8d2e7' });
      this.add.text(x + 40, y + 46, '费: 1', { fontSize: '16px', color: '#f7d794' });

      cardRect.on('pointerdown', () => this.playCard(card));
    });
  }

  private renderEndTurnButton() {
    const button = this.add
      .rectangle(790, 540, 180, 52, 0x4c3b74)
      .setStrokeStyle(2, 0xd6c0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(718, 524, '结束回合', { fontSize: '24px', color: '#ffffff' });

    button.on('pointerdown', () => this.endTurn());
  }

  private playCard(card: Card) {
    if (this.isCombatOver()) return;

    if (card.damage) {
      this.enemyHp = Math.max(0, this.enemyHp - card.damage);
      this.messageText.setText(`${card.name}命中，邪祟失去${card.damage}点血`);
    }

    if (card.armor) {
      this.playerArmor += card.armor;
      this.messageText.setText(`护身符生效，获得${card.armor}点护甲`);
    }

    this.updateStatus();
    this.checkCombatResult();
  }

  private endTurn() {
    if (this.isCombatOver()) return;

    const damageAfterArmor = Math.max(0, this.enemyDamage - this.playerArmor);
    this.playerArmor = Math.max(0, this.playerArmor - this.enemyDamage);
    this.playerHp = Math.max(0, this.playerHp - damageAfterArmor);

    this.playerArmor = 0;
    this.messageText.setText(`敌人出手，造成${this.enemyDamage}点伤害`);

    this.updateStatus();
    this.checkCombatResult();
  }

  private checkCombatResult() {
    if (this.enemyHp === 0) {
      this.messageText.setText('战斗胜利');
    } else if (this.playerHp === 0) {
      this.messageText.setText('失败');
    }
  }

  private updateStatus() {
    this.playerStatusText.setText(`玩家血量: ${this.playerHp}  护甲: ${this.playerArmor}`);
    this.enemyStatusText.setText(`敌人血量: ${this.enemyHp}`);
    this.enemyIntentText.setText(`敌人意图：下回合造成 ${this.enemyDamage} 点伤害`);
  }

  private isCombatOver() {
    return this.enemyHp === 0 || this.playerHp === 0;
  }
}
