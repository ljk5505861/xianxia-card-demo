import Phaser from 'phaser';
import battleBg from '../../assets/battle-temple-courtyard.svg';
import paperDemon from '../../assets/paper-demon.svg';
import nightPatrol from '../../assets/night-patrol.svg';
import slash from '../../assets/slash.svg';
import guardTalisman from '../../assets/guard-talisman.svg';
import fireTalisman from '../../assets/fire-talisman.svg';

type Card = {
  name: string;
  description: string;
  cost: number;
  damage?: number;
  armor?: number;
  art: string;
};

export class BattleScene extends Phaser.Scene {
  private playerHp = 30;
  private playerArmor = 0;
  private playerMana = 3;
  private readonly playerMaxMana = 3;
  private enemyHp = 40;
  private readonly enemyDamage = 8;

  private readonly cards: Card[] = [
    { name: '斩击', description: '造成6点伤害', cost: 1, damage: 6, art: 'card-slash' },
    { name: '护身符', description: '获得5点护甲', cost: 1, armor: 5, art: 'card-guard-talisman' },
    { name: '火符', description: '造成10点伤害', cost: 2, damage: 10, art: 'card-fire-talisman' },
  ];

  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private enemyIntentText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private battleLogText!: Phaser.GameObjects.Text;
  private battleLog: string[] = [];

  constructor() {
    super('battle-scene');
  }

  preload() {
    this.load.image('battle-bg', battleBg);
    this.load.image('paper-demon', paperDemon);
    this.load.image('night-patrol', nightPatrol);
    this.load.image('card-slash', slash);
    this.load.image('card-guard-talisman', guardTalisman);
    this.load.image('card-fire-talisman', fireTalisman);
  }

  create() {
    this.resetCombatState();
    this.drawBattleLayout();
    this.renderCards();
    this.renderEndTurnButton();
    this.updateStatus();
    this.messageText.setText('战斗开始');
    this.pushBattleLog('战斗开始');
  }

  private resetCombatState() {
    this.playerHp = 30;
    this.playerArmor = 0;
    this.playerMana = this.playerMaxMana;
    this.enemyHp = 40;
    this.battleLog = [];
  }

  private drawBattleLayout() {
    this.add.image(450, 300, 'battle-bg').setDisplaySize(900, 600).setAlpha(0.98);
    this.add.rectangle(450, 300, 900, 600, 0x080512, 0.26);

    this.add.text(60, 30, '荒庙夜巡', { fontSize: '32px', color: '#f7d794' });
    this.add.text(748, 568, 'SVG资源版 v1', { fontSize: '18px', color: '#ddd6f4' });

    this.add.text(130, 110, '巡夜人', { fontSize: '26px', color: '#9fe7ff' });
    this.add.text(650, 110, '纸人妖', { fontSize: '26px', color: '#ffb2b2' });

    this.add.image(205, 250, 'night-patrol').setDisplaySize(150, 185);
    this.add.image(700, 245, 'paper-demon').setDisplaySize(150, 180);

    this.playerStatusText = this.add.text(80, 350, '', { fontSize: '22px', color: '#ffffff' });
    this.enemyStatusText = this.add.text(590, 350, '', { fontSize: '22px', color: '#ffffff' });
    this.enemyIntentText = this.add.text(575, 385, '', {
      fontSize: '19px',
      color: '#ffd166',
    });
    this.manaText = this.add.text(80, 385, '', { fontSize: '19px', color: '#8bf5ce' });

    this.messageText = this.add.text(330, 420, '', { fontSize: '30px', color: '#ffeaa7' });
    this.battleLogText = this.add.text(540, 20, '', { fontSize: '16px', color: '#e4ddff', lineSpacing: 6 });
  }

  private renderCards() {
    this.cards.forEach((card, index) => {
      const x = 170 + index * 240;
      const y = 518;

      const cardRect = this.add
        .rectangle(x, y, 205, 150, 0xefe1c3)
        .setStrokeStyle(3, 0x5f4725)
        .setInteractive({ useHandCursor: true });

      this.add.image(x, y - 24, card.art).setDisplaySize(175, 86);
      this.add.rectangle(x, y + 36, 188, 48, 0x251733, 0.9);
      this.add.text(x - 90, y + 16, `${card.name}  费:${card.cost}`, { fontSize: '20px', color: '#f5ddb8' });
      this.add.text(x - 90, y + 42, card.description, { fontSize: '16px', color: '#efe9ff' });

      cardRect.on('pointerdown', () => this.playCard(card));
    });
  }

  private renderEndTurnButton() {
    const button = this.add
      .rectangle(790, 458, 180, 52, 0x4c3b74)
      .setStrokeStyle(2, 0xd6c0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(718, 442, '结束回合', { fontSize: '24px', color: '#ffffff' });
    button.on('pointerdown', () => this.endTurn());
  }

  private playCard(card: Card) {
    if (this.isCombatOver()) return;
    if (this.playerMana < card.cost) {
      this.messageText.setText('法力不足');
      this.pushBattleLog(`法力不足，无法使用${card.name}`);
      return;
    }

    this.playerMana -= card.cost;

    if (card.damage) {
      this.enemyHp = Math.max(0, this.enemyHp - card.damage);
      this.messageText.setText(`${card.name}命中，邪祟失去${card.damage}点血`);
      this.pushBattleLog(`你使用${card.name}，造成${card.damage}伤害`);
    }

    if (card.armor) {
      this.playerArmor += card.armor;
      this.messageText.setText(`护身符生效，获得${card.armor}点护甲`);
      this.pushBattleLog(`你使用${card.name}，获得${card.armor}护甲`);
    }

    this.updateStatus();
    this.checkCombatResult();
  }

  private endTurn() {
    if (this.isCombatOver()) return;

    const damageAfterArmor = Math.max(0, this.enemyDamage - this.playerArmor);
    this.playerHp = Math.max(0, this.playerHp - damageAfterArmor);
    this.playerArmor = 0;
    this.playerMana = this.playerMaxMana;

    this.messageText.setText(`敌人出手，造成${damageAfterArmor}点伤害`);
    this.pushBattleLog(`敌人攻击${this.enemyDamage}，你承受${damageAfterArmor}伤害`);

    this.updateStatus();
    this.checkCombatResult();
  }

  private checkCombatResult() {
    if (this.enemyHp === 0) {
      this.messageText.setText('战斗胜利');
      this.pushBattleLog('你击败了纸人妖，战斗胜利');
    } else if (this.playerHp === 0) {
      this.messageText.setText('失败');
      this.pushBattleLog('巡夜人倒下，战斗失败');
    }
  }

  private pushBattleLog(line: string) {
    this.battleLog.unshift(line);
    this.battleLog = this.battleLog.slice(0, 6);
    this.battleLogText.setText(`战斗日志\n${this.battleLog.join('\n')}`);
  }

  private updateStatus() {
    this.playerStatusText.setText(`玩家血量: ${this.playerHp}  护甲: ${this.playerArmor}`);
    this.manaText.setText(`法力: ${this.playerMana}/${this.playerMaxMana}`);
    this.enemyStatusText.setText(`敌人血量: ${this.enemyHp}`);
    this.enemyIntentText.setText(`敌人意图：下回合造成 ${this.enemyDamage} 点伤害`);
  }

  private isCombatOver() {
    return this.enemyHp === 0 || this.playerHp === 0;
  }
}
