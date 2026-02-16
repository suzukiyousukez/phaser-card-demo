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

    // ===== プレイヤー状態 =====
    this.actionsLeft = 4;
    this.playerLife = 20;
    this.enemyLife = 40;

    this.gameState = "PLAYER_TURN";

    // ===== 表示 =====
    this.enemyLifeText = this.add.text(width / 2 - 60, 40, `敵ライフ: ${this.enemyLife}`, {
      fontSize: "28px",
      color: "#ff4444"
    });

    this.actionText = this.add.text(20, 20, `行動回数: ${this.actionsLeft}`, {
      fontSize: "24px",
      color: "#ffffff"
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

    this.hand = [];
    this.field = [];

    this.drawCard(4);
  }

  updateActionText() {
    this.actionText.setText(`行動回数: ${this.actionsLeft}`);
  }

  drawCard(num = 1) {
    if (this.actionsLeft <= 0) return;

    for (let i = 0; i < num; i++) {
      if (this.deck.length === 0) return;
      this.hand.push(this.deck.pop());
    }

    this.actionsLeft--;
    this.updateActionText();
    this.renderHand();
  }

  renderHand() {
    if (this.handSprites) {
      this.handSprites.forEach(s => s.destroy());
    }

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
    this.updateActionText();

    this.hand.splice(this.hand.indexOf(cardData), 1);

    cardData.hasAttacked = false;
    this.field.push(cardData);

    this.renderHand();
    this.renderField();
  }

  renderField() {
    if (this.fieldSprites) {
      this.fieldSprites.forEach(s => s.destroy());
    }

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

      // 攻撃力表示
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
    this.updateActionText();

    this.enemyLife -= cardData.attack;
    cardData.hasAttacked = true;

    this.enemyLifeText.setText(`敵ライフ: ${this.enemyLife}`);

    if (this.enemyLife <= 0) {
      this.add.text(250, 300, "勝利！", {
        fontSize: "60px",
        color: "#00ff00"
      });
      this.gameState = "END";
    }
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
