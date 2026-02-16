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
    this.gameState = "DRAW";
    this.turn = 1;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // ===== ターン表示 =====
    this.add.text(20, 20, `${this.turn}ターン目`, {
      fontSize: "28px",
      color: "#ffffff"
    });

    // ===== デッキ作成 =====
    this.deck = [];
    for (let i = 0; i < 20; i++) {
      let r = Phaser.Math.Between(1, 5);
      this.deck.push("card" + r);
    }
    Phaser.Utils.Array.Shuffle(this.deck);

    this.graveyard = [];

    // ===== 山札表示 =====
    this.deckZone = this.add.rectangle(width - 120, 80, 80, 120, 0x4444aa)
      .setStrokeStyle(2, 0xffffff);
    this.deckText = this.add.text(width - 155, 40, `山札\n${this.deck.length}`, {
      fontSize: "18px",
      align: "center"
    });

    // ===== 墓地表示 =====
    this.graveZone = this.add.rectangle(width - 240, 80, 80, 120, 0x333333)
      .setStrokeStyle(2, 0xffffff);
    this.graveText = this.add.text(width - 275, 40, `墓地\n0`, {
      fontSize: "18px",
      align: "center"
    });

    // ===== フィールド4枠 =====
    this.fieldSlots = [];
    const spacing = 160;
    const centerX = width / 2;

    for (let i = 0; i < 4; i++) {
      let x = centerX + (i - 1.5) * spacing;
      let slot = this.add.rectangle(x, height / 2, 120, 160, 0x222222)
        .setStrokeStyle(2, 0xffffff);
      this.fieldSlots.push({ x, y: height / 2, occupied: false });
    }

    // ===== 手札 =====
    this.hand = [];
    this.handSprites = [];

    this.drawCards(4);
  }

  drawCards(num) {
    for (let i = 0; i < num; i++) {
      if (this.deck.length <= 0) break;
      this.hand.push(this.deck.pop());
    }

    this.deckText.setText(`山札\n${this.deck.length}`);
    this.showHand();
    this.gameState = "PLAYER_TURN";
  }

  showHand() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const spacing = 160;

    this.hand.forEach((cardKey, index) => {

      let x = width / 2 + (index - (this.hand.length - 1) / 2) * spacing;
      let y = height - 120;

      let card = this.add.image(x, y, cardKey);

      // 高さ統一
      let targetHeight = 160;
      let scale = targetHeight / card.height;
      card.setScale(scale);

      card.setInteractive();
      card.cardIndex = index;

      card.on("pointerdown", () => {
        this.summon(card);
      });

      this.handSprites.push(card);
    });
  }

  summon(selectedCard) {
    if (this.gameState !== "PLAYER_TURN") return;

    this.gameState = "ANIMATION";

    // 空いてるフィールドを探す
    let slot = this.fieldSlots.find(s => !s.occupied);
    if (!slot) return;

    slot.occupied = true;

    // 他カードロック
    this.handSprites.forEach(c => c.disableInteractive());

    // フィールドへ移動
    this.tweens.add({
      targets: selectedCard,
      x: slot.x,
      y: slot.y,
      scale: selectedCard.scale * 1.1,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.add.text(slot.x - 60, slot.y - 120, "召喚！", {
          fontSize: "24px",
          color: "#ffff00"
        });
      }
    });
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
