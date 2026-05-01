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

type CardType = 'slash' | 'guard' | 'fire';
type CardDef = { type: CardType; name: string; description: string; cost: number; damage?: number; armor?: number; art: string };
type CardInstance = CardDef & { id: string };

type CardView = { instance: CardInstance; container: Phaser.GameObjects.Container; baseX: number; baseY: number; };

export class BattleScene extends Phaser.Scene {
  private readonly playerMaxMana = 3;
  private readonly enemyDamage = 8;
  private playerHp = 30;
  private playerArmor = 0;
  private playerMana = 3;
  private enemyHp = 40;

  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private enemyIntentText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private battleLogText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private handZoneTop = 820;

  private readonly cardDefs: Record<CardType, CardDef> = {
    slash: { type: 'slash', name: '斩击', description: '造成6点伤害', cost: 1, damage: 6, art: 'card-slash' },
    guard: { type: 'guard', name: '护身符', description: '获得5点护甲', cost: 1, armor: 5, art: 'card-guard-talisman' },
    fire: { type: 'fire', name: '火符', description: '造成10点伤害', cost: 2, damage: 10, art: 'card-fire-talisman' },
  };
  private deck: CardInstance[] = [];
  private discard: CardInstance[] = [];
  private hand: CardInstance[] = [];
  private handViews = new Map<string, CardView>();
  private battleLog: string[] = [];
  private isBusy = false;

  preload() { /* assets */
    this.load.image('battle-bg-png', battleBgPng); this.load.image('battle-bg-svg', battleBgSvg);
    this.load.image('paper-demon-png', paperDemonPng); this.load.image('paper-demon-svg', paperDemonSvg);
    this.load.image('night-patrol-png', nightPatrolPng); this.load.image('night-patrol-svg', nightPatrolSvg);
    this.load.image('card-slash-png', slashPng); this.load.image('card-slash-svg', slashSvg);
    this.load.image('card-guard-talisman-png', guardTalismanPng); this.load.image('card-guard-talisman-svg', guardTalismanSvg);
    this.load.image('card-fire-talisman-png', fireTalismanPng); this.load.image('card-fire-talisman-svg', fireTalismanSvg);
  }

  create() {
    this.resetCombatState();
    this.drawBattleLayout();
    this.drawHand();
    this.updateStatus();
    this.pushBattleLog('战斗开始，抽3张手牌');
    this.messageText.setText('拖拽卡牌向上释放');
  }

  private resetCombatState() {
    this.playerHp = 30; this.playerArmor = 0; this.playerMana = this.playerMaxMana; this.enemyHp = 40;
    this.deck = this.makeDeck(); this.discard = []; this.hand = []; this.battleLog = [];
    this.drawCardsToHand(3);
  }
  private makeDeck() {
    const list: CardInstance[] = [];
    const push = (type: CardType, n: number) => { for (let i=0;i<n;i++) list.push({ ...this.cardDefs[type], id: `${type}-${i}-${Math.random().toString(36).slice(2,7)}`}); };
    push('slash',3); push('guard',2); push('fire',2);
    return Phaser.Utils.Array.Shuffle(list);
  }

  private drawBattleLayout() {
    this.add.image(960, 540, this.pickTexture('battle-bg')).setDisplaySize(1920, 1080).setAlpha(0.98);
    this.add.rectangle(960, 540, 1920, 1080, 0x05060d, 0.45);
    this.add.text(70, 40, '荒庙夜巡', { fontSize: '56px', color: '#f7d794' });
    this.add.text(1740, 1048, 'Images资源版 v2', { fontSize: '22px', color: '#d8d2e5' }).setAlpha(0.7);

    this.add.rectangle(420, 420, 520, 500, 0x111620, 0.62).setStrokeStyle(3, 0x3f546b, 0.85);
    this.add.rectangle(1500, 420, 520, 500, 0x1a1017, 0.62).setStrokeStyle(3, 0x6b4255, 0.85);
    this.playerSprite = this.add.image(420, 430, this.pickTexture('night-patrol')).setDisplaySize(320, 390);
    this.enemySprite = this.add.image(1500, 430, this.pickTexture('paper-demon')).setDisplaySize(320, 390);

    this.playerStatusText = this.add.text(220, 645, '', { fontSize: '34px', color: '#f2f6ff', lineSpacing: 12 });
    this.manaText = this.add.text(220, 782, '', { fontSize: '32px', color: '#8bf5ce' });
    this.enemyStatusText = this.add.text(1300, 645, '', { fontSize: '34px', color: '#fff3f3', lineSpacing: 12 });
    this.enemyIntentText = this.add.text(1300, 780, '', { fontSize: '30px', color: '#ffd166' });

    this.add.rectangle(960, 180, 700, 180, 0x090f1b, 0.72).setStrokeStyle(2, 0x7384aa, 0.85);
    this.battleLogText = this.add.text(640, 106, '', { fontSize: '28px', color: '#e4ddff', lineSpacing: 8 });
    this.messageText = this.add.text(780, 860, '', { fontSize: '36px', color: '#ffeaa7' });

    const endBg = this.add.rectangle(1690, 915, 340, 86, 0x4c3b74).setStrokeStyle(3, 0xd6c0ff).setInteractive({ useHandCursor: true });
    const endTx = this.add.text(1610, 886, '结束回合', { fontSize: '46px', color: '#fff' });
    this.add.container(0,0,[endBg,endTx]);
    endBg.on('pointerdown', () => this.endTurn());
  }

  private drawCardsToHand(count:number){
    while (this.hand.length < 3 && count > 0) {
      if (!this.deck.length) { this.deck = Phaser.Utils.Array.Shuffle([...this.discard]); this.discard = []; }
      const c = this.deck.shift(); if (!c) break; this.hand.push(c); count--;
    }
  }

  private drawHand() {
    this.handViews.forEach((v) => v.container.destroy());
    this.handViews.clear();
    const startX = 700;
    this.hand.forEach((card, idx) => {
      const x = startX + idx * 250; const y = 950;
      const container = this.createCard(card, x, y);
      this.handViews.set(card.id, { instance: card, container, baseX: x, baseY: y });
    });
  }

  private createCard(card: CardInstance, x: number, y: number) {
    const bg = this.add.rectangle(0, 0, 220, 280, 0xdccdb2).setStrokeStyle(4, 0x5f4725);
    const art = this.add.image(0, -60, this.pickTexture(card.art)).setDisplaySize(188, 110);
    const bottom = this.add.rectangle(0, 70, 196, 120, 0x251733, 0.95);
    const costBubble = this.add.circle(-84, -114, 23, 0x3b2c14, 0.95).setStrokeStyle(3, 0xf8d991);
    const cost = this.add.text(-92, -128, `${card.cost}`, { fontSize: '28px', color: '#ffe9ab' });
    const name = this.add.text(-88, 20, card.name, { fontSize: '29px', color: '#f5ddb8' });
    const desc = this.add.text(-88, 58, card.description, { fontSize: '22px', color: '#efe9ff', wordWrap: { width: 170 } });
    const c = this.add.container(x, y, [bg, art, bottom, costBubble, cost, name, desc]);
    bg.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(bg);
    bg.on('pointerover', () => this.tweens.add({ targets: c, y: y - 20, duration: 130 }));
    bg.on('pointerout', () => { if (!this.input.activePointer.isDown) this.tweens.add({ targets: c, y, duration: 120 }); });
    bg.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => { c.setPosition(dragX, dragY); c.setScale(1.03); });
    bg.on('dragend', () => this.onCardDragEnd(card, c));
    return c;
  }

  private onCardDragEnd(card: CardInstance, view: Phaser.GameObjects.Container) {
    if (this.isBusy || this.isCombatOver()) return;
    const shouldCast = view.y < this.handZoneTop - 120;
    if (!shouldCast) return this.returnCard(view, card.id);
    if (this.playerMana < card.cost) { this.floatText(view.x, view.y - 80, '法力不足', 0xff9f9f); this.returnCard(view, card.id); return; }
    this.castCard(card, view);
  }

  private returnCard(view: Phaser.GameObjects.Container, cardId: string) {
    const base = this.handViews.get(cardId); if (!base) return;
    this.tweens.add({ targets: view, x: base.baseX, y: base.baseY, scale: 1, duration: 170, ease: 'Quad.easeOut' });
  }

  private castCard(card: CardInstance, view: Phaser.GameObjects.Container) {
    this.isBusy = true;
    this.playerMana -= card.cost;
    this.tweens.add({ targets: view, x: card.damage ? this.enemySprite.x : this.playerSprite.x, y: card.damage ? this.enemySprite.y : this.playerSprite.y, scale: 0.25, alpha: 0, duration: 250,
      onComplete: () => { view.destroy(); this.resolveCard(card); this.afterCardUse(card); }, });
  }

  private resolveCard(card: CardInstance) {
    if (card.type === 'slash') {
      this.playerLunge(); this.hitEnemy(card.damage ?? 0, '斩击');
    } else if (card.type === 'fire') {
      this.launchFire(); this.hitEnemy(card.damage ?? 0, '火符', true);
    } else if (card.type === 'guard') {
      this.playerArmor += card.armor ?? 0;
      this.playerBuffEffect();
      this.floatText(this.playerSprite.x, this.playerSprite.y - 220, `护甲 +${card.armor}`, 0x89e5ff);
      this.pushBattleLog(`你使用护身符，获得${card.armor}护甲`);
      this.messageText.setText('符光护体');
    }
    this.updateStatus();
  }

  private afterCardUse(card: CardInstance) {
    this.hand = this.hand.filter((h) => h.id !== card.id);
    this.discard.push(card);
    this.drawHand();
    this.checkCombatResult();
    this.time.delayedCall(250, () => { this.isBusy = false; });
  }

  private playerLunge() { this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 45, duration: 120, yoyo: true }); }
  private launchFire() { const fire = this.add.image(this.playerSprite.x + 80, this.playerSprite.y - 40, this.pickTexture('card-fire-talisman')).setDisplaySize(120, 70).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: fire, x: this.enemySprite.x - 30, y: this.enemySprite.y - 60, alpha: 0.15, scale: 1.2, duration: 300, onComplete: () => fire.destroy() }); }
  private playerBuffEffect() { this.tweens.add({ targets: this.playerSprite, scale: 1.08, duration: 120, yoyo: true }); this.add.circle(this.playerSprite.x, this.playerSprite.y, 80, 0x77d9ff, 0.3).setStrokeStyle(6, 0xaee9ff, 0.5).setDepth(2); }

  private hitEnemy(dmg: number, source: string, fire = false) {
    this.enemyHp = Math.max(0, this.enemyHp - dmg);
    this.enemySprite.setTint(fire ? 0xff7f50 : 0xff5555);
    this.tweens.add({ targets: this.enemySprite, x: this.enemySprite.x + 20, duration: 70, yoyo: true, repeat: 2, onComplete: () => this.enemySprite.clearTint() });
    if (fire) this.add.circle(this.enemySprite.x, this.enemySprite.y - 30, 100, 0xff7438, 0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.floatText(this.enemySprite.x, this.enemySprite.y - 220, `-${dmg}`, 0xffa0a0);
    this.messageText.setText(`${source}命中，造成${dmg}伤害`);
    this.pushBattleLog(`你使用${source}，造成${dmg}伤害`);
  }

  private endTurn() {
    if (this.isBusy || this.isCombatOver()) return;
    this.isBusy = true;
    this.tweens.add({ targets: this.enemySprite, x: this.enemySprite.x - 45, duration: 130, yoyo: true });
    const absorbed = Math.min(this.playerArmor, this.enemyDamage);
    const hpLoss = Math.max(0, this.enemyDamage - this.playerArmor);
    this.playerArmor = Math.max(0, this.playerArmor - this.enemyDamage);
    this.playerHp = Math.max(0, this.playerHp - hpLoss);
    this.playerSprite.setTint(hpLoss > 0 ? 0xff6666 : 0xe7fdff);
    this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x - 20, duration: 70, yoyo: true, repeat: 2, onComplete: () => this.playerSprite.clearTint() });
    if (absorbed > 0) this.floatText(this.playerSprite.x, this.playerSprite.y - 210, `护甲 -${absorbed}`, 0x96e7ff);
    if (hpLoss > 0) this.floatText(this.playerSprite.x + 50, this.playerSprite.y - 170, `生命 -${hpLoss}`, 0xff9d9d);
    this.messageText.setText(`敌人攻击 ${this.enemyDamage}`);
    this.pushBattleLog(`敌人攻击${this.enemyDamage}，护甲吸收${absorbed}，生命损失${hpLoss}`);
    this.playerMana = this.playerMaxMana;
    this.drawCardsToHand(3);
    this.drawHand();
    this.updateStatus();
    this.checkCombatResult();
    this.time.delayedCall(260, () => { this.isBusy = false; });
  }

  private floatText(x:number, y:number, content:string, color:number) { const txt = this.add.text(x, y, content, { fontSize:'36px', color: `#${color.toString(16).padStart(6,'0')}` }).setOrigin(0.5); this.tweens.add({ targets: txt, y: y - 80, alpha: 0, duration: 650, onComplete: () => txt.destroy() }); }
  private checkCombatResult() { if (this.enemyHp === 0) this.showResult('战斗胜利', 0x62ffb1); else if (this.playerHp === 0) this.showResult('战斗失败', 0xff8e8e); }
  private showResult(text:string, color:number) { const panel = this.add.rectangle(960, 540, 680, 240, 0x060912, 0.88).setStrokeStyle(4, color); const title = this.add.text(960, 540, text, { fontSize:'88px', color: `#${color.toString(16).padStart(6,'0')}` }).setOrigin(0.5); panel.setScale(0.6); title.setScale(0.6); this.tweens.add({ targets:[panel,title], scale:1, alpha:{from:0,to:1}, duration:260, ease:'Back.Out' }); }
  private updateStatus() { this.playerStatusText.setText(`生命：${this.playerHp}\n护甲：${this.playerArmor}`); this.manaText.setText(`法力：${this.playerMana}/${this.playerMaxMana}   牌堆：${this.deck.length}  弃牌：${this.discard.length}`); this.enemyStatusText.setText(`生命：${this.enemyHp}`); this.enemyIntentText.setText(`下回合意图：攻击 ${this.enemyDamage}`); }
  private pushBattleLog(line:string) { this.battleLog.unshift(line); this.battleLog = this.battleLog.slice(0,5); this.battleLogText.setText(`战斗日志\n${this.battleLog.join('\n')}`); }
  private isCombatOver() { return this.enemyHp === 0 || this.playerHp === 0; }
  private pickTexture(baseKey: string) { return this.textures.exists(`${baseKey}-png`) ? `${baseKey}-png` : `${baseKey}-svg`; }
}
