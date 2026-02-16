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
        if (this.uiElements) {
            this.uiElements.forEach(element => {
                if (element && element.destroy) element.destroy();
            });
        }
        this.uiElements = [];

        // 上部パネル（敵情報エリア）
        const topPanel = UIHelper.createPanel(this, 10, 10, width - 20, 80);
        this.uiElements.push(topPanel);

        // 敵HP表示
        this.enemyText = this.add.text(width/2, 50, "", {
            fontSize: "24px",
            color: "#ff6666",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.uiElements.push(this.enemyText);

        // 左上パネル（ターン情報）
        const turnPanel = UIHelper.createPanel(this, 10, 100, 120, 70);
        this.uiElements.push(turnPanel);

        this.turnText = this.add.text(70, 135, "", {
            fontSize: "14px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);
        this.uiElements.push(this.turnText);

        // 右上（デッキボタン）
        const deckBtn = UIHelper.createButton(
            this, 
            width - 70, 
            135, 
            120, 
            70, 
            "", 
            () => {
                if (this.gameOver) return;
                if (this.actionsLeft > 0) {
                    this.actionsLeft--;
                    this.drawCard(1);
                    this.updateUI();
                }
            }
        );
        this.deckText = deckBtn.text;
        this.uiElements.push(deckBtn.button, deckBtn.text);

        // 下部パネル（手札エリアの背景）
        const handPanel = UIHelper.createPanel(this, 10, height - 180, width - 20, 130);
        this.uiElements.push(handPanel);

        // エンドターンボタン（最下部）
        const endTurnBtn = UIHelper.createButton(
            this,
            width / 2,
            height - 30,
            150,
            50,
            "ターン終了",
            () => this.endTurn()
        );
        this.endTurnButton = endTurnBtn.button;
        this.endTurnText = endTurnBtn.text;
        this.uiElements.push(endTurnBtn.button, endTurnBtn.text);

        // 勝敗表示用
        if (!this.resultText) {
            this.resultText = this.add.text(width/2, height/2, "", {
                fontSize: "36px",
                color: "#ffff00",
                backgroundColor: "#000000",
                padding: { x: 30, y: 20 }
            }).setOrigin(0.5).setVisible(false).setDepth(2000);
        } else {
            this.resultText.setPosition(width/2, height/2);
        }

        this.updateUI();
    }

    updateUI() {
        this.enemyText.setText("敵 HP: " + this.enemyHP);
        this.turnText.setText("ターン: " + this.turn + "\n行動: " + this.actionsLeft);
        this.deckText.setText("山札\n" + this.deck.length);
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

        // 手札エリア（下部パネル内）
        const y = height - 115;
        const cardWidth = Math.min(65, width * 0.15);
        const cardHeight = cardWidth * 1.4;
        const spacing = Math.min(70, width * 0.17);
        const startX = width/2 - ((this.hand.length - 1) * spacing) / 2;

        this.hand.forEach((card, index) => {

            const x = startX + index * spacing;

            // カード背景
            const cardBg = this.add.rectangle(x, y, cardWidth + 4, cardHeight + 4, 0xffffff)
                .setStrokeStyle(2, 0x00ff00);
            this.handSprites.push(cardBg);

            const sprite = this.add.image(x, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.summon(card));

            const attackText = this.add.text(x, y + cardHeight/2 - 8, "ATK " + card.attack, {
                fontSize: "12px",
                color: "#000000",
                backgroundColor: "#ffff00",
                padding: { x: 6, y: 3 },
                fontStyle: "bold"
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

        // フィールドエリア（中央）
        const y = height * 0.4;
        const cardWidth = Math.min(75, width * 0.18);
        const cardHeight = cardWidth * 1.4;
        const spacing = Math.min(85, width * 0.2);
        const startX = width/2 - ((this.field.length - 1) * spacing) / 2;

        this.field.forEach((card, index) => {

            const x = startX + index * spacing;

            // カード背景
            const cardBg = this.add.rectangle(x, y, cardWidth + 4, cardHeight + 4, 0xffffff)
                .setStrokeStyle(2, 0xff0000);
            this.fieldSprites.push(cardBg);

            const sprite = this.add.image(x, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.attack(card));

            const attackText = this.add.text(x, y + cardHeight/2 - 8, "ATK " + card.attack, {
                fontSize: "13px",
                color: "#ffffff",
                backgroundColor: "#ff0000",
                padding: { x: 7, y: 3 },
                fontStyle: "bold"
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
