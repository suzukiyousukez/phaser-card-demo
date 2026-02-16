class MainScene extends Phaser.Scene {

    constructor() {
        super("main");
    }

    preload() {
        this.load.image("card1", "assets/card1.jpg");
        this.load.image("card2", "assets/card2.jpg");
        this.load.image("card3", "assets/card3.jpg");
    }

    create() {

        // ===== 状態 =====
        this.turn = 1;
        this.actionsLeft = 4;
        this.enemyHP = 40;

        this.deck = [
            { key: "card1", attack: 5 },
            { key: "card2", attack: 3 },
            { key: "card3", attack: 7 },
            { key: "card1", attack: 5 },
            { key: "card2", attack: 3 },
            { key: "card3", attack: 7 }
        ];

        this.hand = [];
        this.field = [];

        // 初期ドロー
        this.drawCard(4);

        this.createLayout();
        this.renderAll();
    }

    // =========================
    // UI
    // =========================

    createLayout() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 敵HP
        this.enemyText = this.add.text(width/2, height * 0.06, "", {
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // ターン表示
        this.turnText = this.add.text(20, height * 0.12, "", {
            fontSize: "16px",
            color: "#ffffff"
        });

        // デッキ
        this.deckText = this.add.text(width - 60, height * 0.12, "", {
            fontSize: "16px",
            backgroundColor: "#000",
            padding: { x: 8, y: 5 }
        }).setOrigin(0.5).setInteractive();

        this.deckText.on("pointerdown", () => {
            if (this.actionsLeft > 0) {
                this.actionsLeft--;
                this.drawCard(1);
                this.updateUI();
            }
        });

        // エンドターン
        this.endBtn = this.add.text(width/2, height * 0.94, "END TURN", {
            fontSize: "20px",
            backgroundColor: "#550000",
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();

        this.endBtn.on("pointerdown", () => this.endTurn());

        this.updateUI();
    }

    updateUI() {
        this.enemyText.setText("Enemy HP : " + this.enemyHP);
        this.turnText.setText("Turn: " + this.turn + "\nActions: " + this.actionsLeft);
        this.deckText.setText("Deck\n" + this.deck.length);
    }

    // =========================
    // ドロー
    // =========================

    drawCard(num) {

        for (let i = 0; i < num; i++) {

            if (this.deck.length === 0) return;
            if (this.hand.length >= 4) return; // 手札上限4枚

            const card = this.deck.shift();
            this.hand.push(card);
        }

        this.renderHand();
        this.updateUI();
    }

    // =========================
    // 召喚
    // =========================

    summon(card) {

        if (this.actionsLeft <= 0) return;

        this.actionsLeft--;

        const index = this.hand.indexOf(card);
        if (index !== -1) {
            this.hand.splice(index, 1);
            this.field.push(card);
        }

        this.renderAll();
        this.updateUI();
    }

    // =========================
    // 攻撃
    // =========================

    attack(card) {

        if (this.actionsLeft <= 0) return;

        this.actionsLeft--;
        this.enemyHP -= card.attack;

        if (this.enemyHP < 0) this.enemyHP = 0;

        this.updateUI();
    }

    // =========================
    // ターン終了
    // =========================

    endTurn() {
        this.turn++;
        this.actionsLeft = 4;
        this.updateUI();
    }

    // =========================
    // 描画
    // =========================

    renderAll() {
        this.renderHand();
        this.renderField();
    }

    renderHand() {

        if (this.handSprites) this.handSprites.forEach(s => s.destroy());
        this.handSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const y = height * 0.8;
        const spacing = 80;
        const startX = width/2 - ((this.hand.length - 1) * spacing) / 2;

        this.hand.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(70, 100)
                .setInteractive();

            sprite.on("pointerdown", () => this.summon(card));

            this.handSprites.push(sprite);
        });
    }

    renderField() {

        if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
        this.fieldSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const y = height * 0.45;
        const spacing = 90;
        const startX = width/2 - ((this.field.length - 1) * spacing) / 2;

        this.field.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(90, 130)
                .setInteractive();

            sprite.on("pointerdown", () => this.attack(card));

            this.fieldSprites.push(sprite);
        });
    }
}


// =========================
// ゲーム設定（スマホ縦）
// =========================

const config = {
    type: Phaser.AUTO,
    width: 390,
    height: 844,
    backgroundColor: "#1e1e2f",
    scene: MainScene
};

new Phaser.Game(config);
