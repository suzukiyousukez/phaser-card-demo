class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        for (let i = 1; i <= 20; i++) {
            this.load.image("card" + i, "assets/card" + i + ".jpg");
        }
    }

    create() {

        this.turn = 1;
        this.actionsLeft = 4;
        this.enemyLife = 40;
        this.enemyMaxLife = 40;
        this.isGameOver = false;

        this.hand = [];
        this.field = [];
        this.deck = [];

        this.createDeck();
        this.createLayout();
        this.drawCard(4);

        this.showTurnBanner("TURN 1", "DRAW");
    }

    // =========================
    // デッキ生成
    // =========================
    createDeck() {

    this.deck = [];

    CARD_DATA.forEach(card => {

        this.deck.push({
            ...card,
            hasAttacked: false
        });

    });

    Phaser.Utils.Array.Shuffle(this.deck);
}


    // =========================
    // UI作成
    // =========================
    createLayout() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(width/2, height/2, width, height, 0x1e1e2f);

        // HPバー
        const hpBarY = 100;
        const hpBarWidth = 280;
        const hpBarHeight = 30;

        this.hpBarBg = this.add.rectangle(width/2, hpBarY, hpBarWidth, hpBarHeight, 0x333333)
            .setStrokeStyle(3, 0xffffff);

        this.hpBar = this.add.rectangle(
            width/2 - hpBarWidth/2,
            hpBarY,
            hpBarWidth,
            hpBarHeight,
            0xff3333
        ).setOrigin(0, 0.5);

        this.enemyText = this.add.text(width/2, hpBarY, "", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 65, "敵 HP", {
    fontSize: "14px",
    color: "#cccccc"
}).setOrigin(0.5);

        const y = height * 0.45;
        this.add.text(width/2, height * 0.32, "フィールド", {
    fontSize: "16px",
    color: "#ffffff"
}).setOrigin(0.5);


        const y2 = height - 160;
        this.add.text(width/2, height - 220, "手札", {
    fontSize: "16px",
    color: "#ffffff"
}).setOrigin(0.5);

        
        // ターン情報
        this.turnText = this.add.text(20, 20, "", {
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 8, y: 5 }
        });

        // デッキ（タップでドロー）
        this.deckText = this.add.text(width - 20, 20, "", {
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#0066cc",
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setInteractive();

        this.deckText.on("pointerdown", () => {

            if (this.actionsLeft <= 0) return;
            if (this.deck.length <= 0) return;
            if (this.hand.length >= 4) return;

            this.actionsLeft--;
            this.drawCard(1);
        });

        // エンドターン
        const endBtn = this.add.text(width/2, height - 30, "次のターン", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#cc0000",
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive().setDepth(1000);

        endBtn.on("pointerdown", () => this.endTurn());

        this.updateUI();
    }

    // =========================
    // UI更新
    // =========================
    updateUI() {

        if (this.enemyLife < 0) this.enemyLife = 0;

        const hpBarWidth = 280;
        const hpPercent = this.enemyLife / this.enemyMaxLife;
        this.hpBar.width = hpBarWidth * hpPercent;

        if (hpPercent > 0.5) {
            this.hpBar.setFillStyle(0x33ff33);
        } else if (hpPercent > 0.25) {
            this.hpBar.setFillStyle(0xffcc00);
        } else {
            this.hpBar.setFillStyle(0xff3333);
        }

        this.enemyText.setText(this.enemyLife + " / " + this.enemyMaxLife);
        this.turnText.setText("ターン数: " + this.turn + "\n行動: " + this.actionsLeft);
        this.deckText.setText("デッキ: " + this.deck.length);

        // デッキ押せるかどうか視覚化
        if (this.actionsLeft <= 0 || this.hand.length >= 4 || this.deck.length <= 0) {
            this.deckText.setAlpha(0.4);
        } else {
            this.deckText.setAlpha(1);
        }
    }

    // =========================
    // ドロー
    // =========================
    drawCard(count = 1) {

        for (let i = 0; i < count; i++) {

            if (this.hand.length >= 4) break;
            if (this.deck.length === 0) break;

            const card = this.deck.pop();
            this.hand.push(card);
        }

        this.renderHand();
        this.updateUI();
    }

    // =========================
    // 手札描画
    // =========================
    renderHand() {

        if (this.handSprites) this.handSprites.forEach(s => s.destroy());
        this.handSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const y = height - 160;
        const cardWidth = 70;
        const cardHeight = 100;
        const spacing = 80;
        const startX = width/2 - ((this.hand.length - 1) * spacing) / 2;

        this.hand.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.summon(card));

            this.handSprites.push(sprite);
        });
    }

    // =========================
    // 召喚
    // =========================
    summon(cardData) {

        if (this.isGameOver) return;

        if (this.actionsLeft <= 0) return;
        if (this.field.length >= 4) return;

        this.actionsLeft--;

        this.hand.splice(this.hand.indexOf(cardData), 1);

        cardData.hasAttacked = true;
        this.field.push(cardData);

        this.renderHand();
        this.renderField();
        this.updateUI();
    }

    // =========================
    // フィールド描画
    // =========================
    renderField() {

        if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
        this.fieldSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const y = height * 0.45;
        const cardWidth = 85;
        const cardHeight = 120;
        const spacing = 95;
        const startX = width/2 - ((this.field.length - 1) * spacing) / 2;

        this.field.forEach((card, index) => {

            const sprite = this.add.image(startX + index * spacing, y, card.key)
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            sprite.on("pointerdown", () => this.attack(card, sprite));

            this.fieldSprites.push(sprite);
        });
    }

    // =========================
    // 攻撃
    // =========================
    attack(cardData, cardSprite) {

        if (this.isGameOver) return;

        if (this.actionsLeft <= 0) return;
        if (cardData.hasAttacked) return;

        this.actionsLeft--;
        cardData.hasAttacked = true;

        this.enemyLife -= cardData.attack;
        if (this.enemyLife < 0) this.enemyLife = 0;

        this.updateUI();
        this.playAttackAnimation(cardSprite, cardData.attack);

        if (this.enemyLife <= 0) {
            this.time.delayedCall(1000, () => {
                this.showTurnBanner("VICTORY", "YOU WIN");
            });
        }
        if (this.enemyLife <= 0) {

    this.isGameOver = true;

    this.time.delayedCall(500, () => {
        this.showTurnBanner("VICTORY", "YOU WIN");
    });
}
    }

    // =========================
    // ターン終了
    // =========================
    endTurn() {

        if (this.isGameOver) return;

        this.turn++;
        this.actionsLeft = 4;

        this.field.forEach(card => {
            card.hasAttacked = false;
        });

        this.updateUI();
        this.showTurnBanner("TURN " + this.turn, "START");
    }

    // =========================
    // 攻撃演出
    // =========================
    playAttackAnimation(cardSprite, damage) {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.input.enabled = false;

        this.tweens.add({
            targets: cardSprite,
            y: cardSprite.y - 40,
            duration: 150,
            yoyo: true
        });

        const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 0.2)
            .setOrigin(0);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        this.showTurnBanner("ATTACK", "-" + damage);

        const dmgText = this.add.text(width/2, height/2 - 100, "-" + damage, {
            fontSize: "60px",
            color: "#ff3333",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                dmgText.destroy();
                this.input.enabled = true;
            }
        });
    }

    // =========================
    // ターンバナー
    // =========================
    showTurnBanner(mainText, subText) {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0);
        const bar = this.add.rectangle(width/2, height/2, width, 140, 0x000000, 0.75);

        const title = this.add.text(width/2, height/2 - 20, mainText, {
            fontSize: "64px",
            fontStyle: "bold",
            color: "#ffffff"
        }).setOrigin(0.5);

        const subtitle = this.add.text(width/2, height/2 + 35, subText, {
            fontSize: "24px",
            color: "#cccccc"
        }).setOrigin(0.5);

        const container = this.add.container(0, 0, [dim, bar, title, subtitle]);

        container.setAlpha(0);
        container.setScale(0.8);

        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: "Back.Out",
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: container,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => container.destroy()
                    });
                });
            }
        });
    }
}

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
