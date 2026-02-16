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
        this.gameOver = false;

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
        this.usedCards = [];

        // 初期ドロー
        this.drawCard(4);

        this.createLayout();
        this.renderAll();

        // リサイズ対応
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.cameras.resize(width, height);
        this.createLayout();
        this.renderAll();
    }

    // =========================
    // UI
    // =========================

    createLayout() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 既存のUI要素を削除
        if (this.enemyText) this.enemyText.destroy();
        if (this.turnText) this.turnText.destroy();
        if (this.deckText) this.deckText.destroy();
        if (this.endBtn) this.endBtn.destroy();

        // 敵HP（上部中央）
        this.enemyText = this.add.text(width/2, 30, "", {
            fontSize: Math.max(18, width * 0.05) + "px",
            color: "#ff6666",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // ターン表示（左上）
        this.turnText = this.add.text(15, 15, "", {
            fontSize: Math.max(14, width * 0.038) + "px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 8, y: 5 }
        });

        // デッキ（右上）
        this.deckText = this.add.text(width - 15, 15, "", {
            fontSize: Math.max(14, width * 0.038) + "px",
            color: "#ffffff",
            backgroundColor: "#0066cc",
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setInteractive();

        this.deckText.on("pointerdown", () => {
            if (this.gameOver) return;
            if (this.actionsLeft > 0) {
                this.actionsLeft--;
                this.drawCard(1);
                this.updateUI();
            }
        });

        // エンドターンボタン（下部中央）
        this.endBtn = this.add.text(width/2, height - 25, "END TURN", {
            fontSize: Math.max(16, width * 0.045) + "px",
            color: "#ffffff",
            backgroundColor: "#cc0000",
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive();

        this.endBtn.on("pointerdown", () => this.endTurn());

        // 勝敗表示用
        if (!this.resultText) {
            this.resultText = this.add.text(width/2, height/2, "", {
                fontSize: Math.max(28, width * 0.08) + "px",
                color: "#ffff00",
                backgroundColor: "#000000",
                padding: { x: 30, y: 20 }
            }).setOrigin(0.5).setVisible(false);
        } else {
            this.resultText.setPosition(width/2, height/2);
        }

        this.updateUI();
    }

    updateUI() {
        this.enemyText.setText("敵 HP: " + this.enemyHP);
        this.turnText.setText("ターン " + this.turn + "\n行動 " + this.actionsLeft);
        this.deckText.setText("山札: " + this.deck.length);
    }

    // =========================
    // ドロー
    // =========================

    drawCard(num) {

        for (let i = 0; i < num; i++) {

            if (this.deck.length === 0) return;
            if (this.hand.length >= 6) return;

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

        if (this.gameOver) return;
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

        if (this.gameOver) return;
        if (this.actionsLeft <= 0) return;

        this.actionsLeft--;
        this.enemyHP -= card.attack;

        if (this.enemyHP < 0) this.enemyHP = 0;

        const index = this.field.indexOf(card);
        if (index !== -1) {
            this.field.splice(index, 1);
            this.usedCards.push(card);
        }

        this.updateUI();
        this.renderAll();

        if (this.enemyHP === 0) {
            this.showResult("勝利！");
        }
    }

    // =========================
    // 勝敗表示
    // =========================

    showResult(message) {
        this.gameOver = true;
        this.resultText.setText(message).setVisible(true);
    }

    // =========================
    // ターン終了
    // =========================

    endTurn() {
        if (this.gameOver) return;
        
        this.turn++;
        this.actionsLeft = 4;
        this.drawCard(2);
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
        if (this.handTexts) this.handTexts.forEach(t => t.destroy());
        this.handSprites = [];
        this.handTexts = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 手札エリア（画面下部）
        const y = height - 90;
        const cardWidth = Math.min(65, width * 0.16);
        const cardHeight = cardWidth * 1.4;
        const spacing = Math.min(75, width * 0.18);
        const startX = width/2 - ((this.hand.length - 1) * spacing) / 2;

        this.hand.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.summon(card));

            const attackText = this.add.text(startX + index * spacing, y + cardHeight/2 - 5, "ATK:" + card.attack, {
                fontSize: Math.max(11, width * 0.03) + "px",
                color: "#ffff00",
                backgroundColor: "#000000",
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);

            this.handSprites.push(sprite);
            this.handTexts.push(attackText);
        });
    }

    renderField() {

        if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
        if (this.fieldTexts) this.fieldTexts.forEach(t => t.destroy());
        this.fieldSprites = [];
        this.fieldTexts = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // フィールドエリア（画面中央）
        const y = height * 0.4;
        const cardWidth = Math.min(80, width * 0.2);
        const cardHeight = cardWidth * 1.4;
        const spacing = Math.min(90, width * 0.22);
        const startX = width/2 - ((this.field.length - 1) * spacing) / 2;

        this.field.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.attack(card));

            const attackText = this.add.text(startX + index * spacing, y + cardHeight/2 - 5, "ATK:" + card.attack, {
                fontSize: Math.max(12, width * 0.035) + "px",
                color: "#ff0000",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 }
            }).setOrigin(0.5);

            this.fieldSprites.push(sprite);
            this.fieldTexts.push(attackText);
        });
    }
}


// =========================
// ゲーム設定（レスポンシブ対応）
// =========================

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 390,
        height: 844
    },
    backgroundColor: "#1e1e2f",
    scene: MainScene
};

new Phaser.Game(config);
