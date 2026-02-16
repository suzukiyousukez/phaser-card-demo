class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    for (let i = 1; i <= 5; i++) {
      this.load.image("card" + i, "assets/card" + i + ".jpg");
    }
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // ===== 状態 =====
    this.turn = 1;
    this.actionsLeft = 4;
    this.enemyLife = 40;

    // ===== UI表示 =====
    this.turnText = this.add.text(20, 20, `ターン: ${this.turn}`, {
      fontSize: "24px",
      color: "#ffffff"
    });

    this.actionText = this.add.text(20, 50, `行動: ${this.actionsLeft}`, {
      fontSize: "22px",
      color: "#ffffff"
    });

    this.enemyLifeText = this.add.text(width / 2 - 60, 20, `敵ライフ: ${this.enemyLife}`, {
      fontSize: "26px",
      color: "#ff4444"
    });

    // ===== デッキ =====
    this.deck = [];
    for (let i = 0; i < 20; i++) {
      this.deck.push({
        key: "card" + Phaser.Math.Between(1, 5),
        attack: Phaser.Math.Between(3, 8),
        hasAttacked: false
      });
    }
    Phaser.Utils.Array.Shuffle(this.deck);

    this.deckZone = this.add.rectangle(width - 100, 80, 80, 120, 0x4444aa)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();

    this.deckText = this.add.text(width - 130, 30, `山札\n${this.deck.length}`, {
      fontSize: "18px"
    });

    this.deckZone.on("pointerdown", () => {
      this.drawCard();
    });

    // ===== ボタン =====
    this.endTurnButton = this.add.rectangle(width - 100, height - 60, 140, 50, 0xaa4444)
      .setInteractive();
    this.add.text(width - 150, height - 75, "ターン終了", { fontSize: "20px" });

    this.endTurnButton.on("pointerdown", () => {
      this.endTurn();
    });

    // ===== データ =====
    this.hand = [];
    this.field = [];

    this.drawCard(4); // 初期ドロー
  }

  updateUI() {
    this.turnText.setText(`ターン: ${this.turn}`);
    this.actionText.setText(`行動: ${this.actionsLeft}`);
    this.deckText.setText(`山札\n${this.deck.length}`);
    this.enemyLifeText.setText(`敵ライフ: ${this.enemyLife}`);
  }

  drawCard(num = 1) {
    if (this.actionsLeft <= 0) return;
    if (this.deck.length <= 0) return;

    for (let i = 0; i < num; i++) {
      if (this.deck.length === 0) break;
      this.hand.push(this.deck.pop());
    }

    this.actionsLeft--;
    this.updateUI();
    this.renderHand();
  }

  renderHand() {
    if (this.handSprites) this.handSprites.forEach(s => s.destroy());
    this.handSprites = [];

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const spacing = 150;

    this.hand.forEach((card, index) => {

      let x = width / 2 + (index - (this.hand.length - 1) / 2) * spacing;
      let y = height - 120;

      let sprite = this.add.image(x, y, card.key);
      let scale = 150 / sprite.height;
      sprite.setScale(scale);
      sprite.setInteractive();

      sprite.on("pointerdown", () => {
        this.summon(card);
      });

      this.handSprites.push(sprite);
    });
  }

  summon(cardData) {
    if (this.actionsLeft <= 0) return;
    if (this.field.length >= 4) return;

    this.actionsLeft--;

    this.hand.splice(this.hand.indexOf(cardData), 1);
    cardData.hasAttacked = false;
    this.field.push(cardData);

    this.updateUI();
    this.renderHand();
    this.renderField();
  }

  renderField() {
    if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
    this.fieldSprites = [];

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const spacing = 160;

    this.field.forEach((card, index) => {

      let x = width / 2 + (index - (this.field.length - 1) / 2) * spacing;
      let y = height / 2;

      let sprite = this.add.image(x, y, card.key);
      let scale = 180 / sprite.height;
      sprite.setScale(scale);
      sprite.setInteractive();

      sprite.on("pointerdown", () => {
        this.attack(card);
      });

      this.add.text(x - 40, y + 70, `ATK:${card.attack}`, {
        fontSize: "18px",
        color: "#ffff00"
      });

      this.fieldSprites.push(sprite);
    });
  }

  attack(cardData) {
    if (this.actionsLeft <= 0) return;
    if (cardData.hasAttacked) return;

    this.actionsLeft--;
    cardData.hasAttacked = true;
    this.enemyLife -= cardData.attack;

    this.updateUI();

    if (this.enemyLife <= 0) {
      this.add.text(250, 300, "勝利！", {
        fontSize: "60px",
        color: "#00ff00"
      });
    }
  }

  endTurn() {
    this.turn++;
    this.actionsLeft = 4;

    // 攻撃フラグリセット
    this.field.forEach(card => {
      card.hasAttacked = false;
    });

    this.updateUI();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1e1e1e",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: MainScene
};

new Phaser.Game(config);
