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
        this.usedCards = []; // 使用済みカード

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
            if (this.gameOver) return;
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

        // 勝敗表示用（初期は非表示）
        this.resultText = this.add.text(width/2, height/2, "", {
            fontSize: "36px",
            color: "#ffff00",
            backgroundColor: "#000000",
            padding: { x: 30, y: 20 }
        }).setOrigin(0.5).setVisible(false);

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
            if (this.hand.length >= 6) return; // 手札上限を6枚に変更

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

        // カードをフィールドから使用済みへ移動
        const index = this.field.indexOf(card);
        if (index !== -1) {
            this.field.splice(index, 1);
            this.usedCards.push(card);
        }

        this.updateUI();
        this.renderAll();

        // 勝利判定
        if (this.enemyHP === 0) {
            this.showResult("YOU WIN!");
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
        
        // ターン開始時に2枚ドロー
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

        const y = height * 0.8;
        const spacing = 80;
        const startX = width/2 - ((this.hand.length - 1) * spacing) / 2;

        this.hand.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(70, 100)
                .setInteractive();

            sprite.on("pointerdown", () => this.summon(card));

            // 攻撃力を表示
            const attackText = this.add.text(startX + index * spacing, y + 40, "ATK:" + card.attack, {
                fontSize: "12px",
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

        const y = height * 0.45;
        const spacing = 90;
        const startX = width/2 - ((this.field.length - 1) * spacing) / 2;

        this.field.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(90, 130)
                .setInteractive();

            sprite.on("pointerdown", () => this.attack(card));

            // 攻撃力を表示
            const attackText = this.add.text(startX + index * spacing, y + 55, "ATK:" + card.attack, {
                fontSize: "14px",
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
