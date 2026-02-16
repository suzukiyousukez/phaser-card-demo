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

    // ターン表示
    this.turnText = this.add.text(20, 20, "1ターン目", {
      fontSize: "32px",
      fill: "#ffffff"
    });

    // デッキ20枚作成（1〜5をランダムで）
    this.deck = [];
    for (let i = 0; i < 20; i++) {
      let randomCard = Phaser.Math.Between(1, 5);
      this.deck.push("card" + randomCard);
    }

    Phaser.Utils.Array.Shuffle(this.deck);

    this.hand = [];
    this.handSprites = [];

    this.drawCards(4);
  }

  drawCards(num) {

    for (let i = 0; i < num; i++) {
      let card = this.deck.pop();
      this.hand.push(card);
    }

    this.showHand();

    this.gameState = "PLAYER_TURN";
  }

  showHand() {

    const centerX = this.cameras.main.width / 2;
    const y = this.cameras.main.height - 150;

    const spacing = 200;

    this.hand.forEach((cardKey, index) => {

      let x = centerX + (index - 1.5) * spacing;

      let card = this.add.image(x, y, cardKey);

let targetHeight = 180;
let scale = targetHeight / card.height;

card.setScale(scale);

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

    // 他カードロック
    this.handSprites.forEach(card => {
      card.disableInteractive();
    });

    // 召喚演出
    this.tweens.add({
      targets: selectedCard,
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2,
      scale: 0.8,
      duration: 500,
      ease: "Power2"
    });

    this.add.text(
      this.cameras.main.width / 2 - 80,
      this.cameras.main.height / 2 - 200,
      "召喚成功！",
      { fontSize: "40px", fill: "#ffff00" }
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#222222",
  scene: MainScene
};

new Phaser.Game(config);
