class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    // card1.jpg ～ card5.jpg を assets に置く
    for (let i = 1; i <= 5; i++) {
      this.load.image("card" + i, "assets/card" + i + ".jpg");
    }
  }

  create() {
    // ===== 状態 =====
    this.gameState = "DRAW"; // DRAW -> PLAYER_TURN -> ANIMATION

    // ===== ターン表示 =====
    this.turn = 1;
    this.turnText = this.add.text(20, 20, `${this.turn}ターン目`, {
      fontSize: "32px",
      color: "#ffffff"
    });

    // ===== デッキ20枚作成（1〜5ランダム） =====
    this.deck = [];
    for (let i = 0; i < 20; i++) {
      const r = Phaser.Math.Between(1, 5);
      this.deck.push("card" + r);
    }
    Phaser.Utils.Array.Shuffle(this.deck);

    // デッキ残り表示
    this.deckText = this.add.text(20, 60, `山札: ${this.deck.length}`, {
      fontSize: "20px",
      color: "#aaaaaa"
    });

    // ===== 手札 =====
    this.hand = [];
    this.handSprites = [];

    this.drawCards(4);
  }

  // ===== ドロー =====
  drawCards(num) {
    for (let i = 0; i < num; i++) {
      if (this.deck.length <= 0) break;
      const card = this.deck.pop();
      this.hand.push(card);
    }

    this.deckText.setText(`山札: ${this.deck.length}`);
    this.showHand();

    this.gameState = "PLAYER_TURN";
  }

  // ===== 手札表示 =====
  showHand() {
    const centerX = this.cameras.main.width / 2;
    const y = this.cameras.main.height - 160;
    const spacing = 180;

    this.hand.forEach((cardKey, index) => {
      const x = centerX + (index - (this.hand.length - 1) / 2) * spacing;

      let card = this.add.image(x, y, cardKey);

      // 🔥 高さ基準でサイズ統一（ここ重要）
      const targetHeight = 200;
      const scale = targetHeight / card.height;
      card.setScale(scale);

      card.setInteractive();
      card.cardIndex = index;

      // クリック
      card.on("pointerdown", () => {
        this.summon(card);
      });

      this.handSprites.push(card);
    });
  }

  // ===== 召喚 =====
  summon(selectedCard) {
    if (this.gameState !== "PLAYER_TURN") return;

    this.gameState = "ANIMATION";

    // 他カードロック
    this.handSprites.forEach(card => {
      card.disableInteractive();
    });

    // 中央へ移動アニメ
    this.tweens.add({
      targets: selectedCard,
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2,
      scale: selectedCard.scale * 1.2,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.add.text(
          this.cameras.main.width / 2 - 90,
          this.cameras.main.height / 2 - 220,
          "召喚成功！",
          { fontSize: "40px", color: "#ffff00" }
        );
      }
    });
  }
}

// ===== Phaser設定 =====
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
