import Phaser from 'phaser';
import battleBgPng from '../../assets/battle-temple-courtyard.png.png';
import battleBgSvg from '../../assets/battle-temple-courtyard.svg';
import paperDemonPng from '../../assets/paper-demon.png.png';
import paperDemonSvg from '../../assets/paper-demon.svg';
import nightPatrolPng from '../../assets/night-patrol.png.png';
import nightPatrolSvg from '../../assets/night-patrol.svg';
import slashPng from '../../assets/slash.png.png';
import slashSvg from '../../assets/slash.svg';
import guardTalismanPng from '../../assets/guard-talisman.png.png';
import guardTalismanSvg from '../../assets/guard-talisman.svg';
import fireTalismanPng from '../../assets/fire-talisman.png.png';
import fireTalismanSvg from '../../assets/fire-talisman.svg';

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
    this.load.image('battle-bg-png', battleBgPng);
    this.load.image('battle-bg-svg', battleBgSvg);
    this.load.image('paper-demon-png', paperDemonPng);
    this.load.image('paper-demon-svg', paperDemonSvg);
    this.load.image('night-patrol-png', nightPatrolPng);
    this.load.image('night-patrol-svg', nightPatrolSvg);
    this.load.image('card-slash-png', slashPng);
    this.load.image('card-slash-svg', slashSvg);
    this.load.image('card-guard-talisman-png', guardTalismanPng);
    this.load.image('card-guard-talisman-svg', guardTalismanSvg);
    this.load.image('card-fire-talisman-png', fireTalismanPng);
    this.load.image('card-fire-talisman-svg', fireTalismanSvg);
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
    this.add.image(450, 300, this.pickTexture('battle-bg')).setDisplaySize(900, 600).setAlpha(0.98);
    this.add.rectangle(450, 300, 900, 600, 0x05060d, 0.52);

    this.add.text(60, 30, '荒庙夜巡', { fontSize: '32px', color: '#f7d794' });
    this.add.text(770, 575, 'Images资源版 v1', { fontSize: '12px', color: '#d8d2e5' }).setAlpha(0.55);

    this.add.rectangle(230, 255, 260, 300, 0x111620, 0.72).setStrokeStyle(2, 0x3f546b, 0.8);
    this.add.rectangle(670, 255, 260, 300, 0x1a1017, 0.72).setStrokeStyle(2, 0x6b4255, 0.8);

    this.add.text(170, 115, '巡夜人', { fontSize: '28px', color: '#9fe7ff' });
    this.add.text(610, 115, '纸人妖', { fontSize: '28px', color: '#ffb2b2' });

    this.add.image(230, 245, this.pickTexture('night-patrol')).setDisplaySize(170, 210);
    this.add.image(670, 245, this.pickTexture('paper-demon')).setDisplaySize(170, 210);

    this.playerStatusText = this.add.text(132, 348, '', { fontSize: '20px', color: '#f2f6ff', lineSpacing: 8 });
    this.enemyStatusText = this.add.text(574, 348, '', { fontSize: '20px', color: '#fff3f3', lineSpacing: 8 });
    this.enemyIntentText = this.add.text(574, 410, '', {
      fontSize: '18px',
      color: '#ffd166',
      lineSpacing: 6,
    });
    this.manaText = this.add.text(132, 410, '', { fontSize: '18px', color: '#8bf5ce' });

    this.messageText = this.add.text(340, 448, '', { fontSize: '28px', color: '#ffeaa7' });
    this.add.rectangle(450, 84, 380, 112, 0x0d1220, 0.68).setStrokeStyle(1, 0x7384aa, 0.75);
    this.battleLogText = this.add.text(292, 42, '', { fontSize: '16px', color: '#e4ddff', lineSpacing: 4 });
  }

  private renderCards() {
    this.cards.forEach((card, index) => {
      const x = 205 + index * 180;
      const y = 535;

      const cardRect = this.add
        .rectangle(x, y, 160, 170, 0xd8ccaf)
        .setStrokeStyle(3, 0x5f4725)
        .setInteractive({ useHandCursor: true });

      this.add.image(x, y - 36, this.pickTexture(card.art)).setDisplaySize(136, 70);
      this.add.rectangle(x, y + 44, 146, 74, 0x251733, 0.94);
      this.add.circle(x - 58, y - 66, 14, 0x3b2c14, 0.95).setStrokeStyle(2, 0xf8d991);
      this.add.text(x - 63, y - 75, `${card.cost}`, { fontSize: '20px', color: '#ffe9ab' });
      this.add.text(x - 58, y + 16, card.name, { fontSize: '18px', color: '#f5ddb8' });
      this.add.text(x - 58, y + 42, card.description, { fontSize: '14px', color: '#efe9ff', wordWrap: { width: 120 } });

      cardRect.on('pointerover', () => {
        cardRect.y = y - 8;
      });
      cardRect.on('pointerout', () => {
        cardRect.y = y;
      });

      cardRect.on('pointerdown', () => this.playCard(card));
    });
  }

  private renderEndTurnButton() {
    const button = this.add
      .rectangle(790, 532, 180, 52, 0x4c3b74)
      .setStrokeStyle(2, 0xd6c0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(718, 515, '结束回合', { fontSize: '24px', color: '#ffffff' });
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
    this.battleLog = this.battleLog.slice(0, 4);
    this.battleLogText.setText(`战斗日志\n${this.battleLog.join('\n')}`);
  }

  private updateStatus() {
    this.playerStatusText.setText(`血量：${this.playerHp}\n护甲：${this.playerArmor}`);
    this.manaText.setText(`法力：${this.playerMana}/${this.playerMaxMana}`);
    this.enemyStatusText.setText(`血量：${this.enemyHp}`);
    this.enemyIntentText.setText(`意图：下回合造成 ${this.enemyDamage} 点伤害`);
  }

  private isCombatOver() {
    return this.enemyHp === 0 || this.playerHp === 0;
  }

  private pickTexture(baseKey: string) {
    const pngKey = `${baseKey}-png`;
    const svgKey = `${baseKey}-svg`;

    return this.textures.exists(pngKey) ? pngKey : svgKey;
  }
}
