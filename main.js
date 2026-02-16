class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        for (let i = 1; i <= 5; i++) {
            this.load.image("card" + i, "assets/card" + i + ".jpg");
        }
    }

    create() {

        this.turn = 1;
        this.actionsLeft = 4;
        this.enemyLife = 40;

        this.hand = [];
        this.field = [];
        this.deck = [];

        this.createDeck();
        this.createLayout();
        this.drawCard(4);

        this.showTurnBanner("TURN 1", "DRAW");
    }

    // -------------------------
    // デッキ生成
    // -------------------------
    createDeck() {
        for (let i = 0; i < 20; i++) {
            this.deck.push({
                key: "card" + Phaser.Math.Between(1, 5),
                attack: Phaser.Math.Between(1, 5),
                hasAttacked: false
            });
        }
        Phaser.Utils.Array.Shuffle(this.deck);
    }

    // -------------------------
    // UI作成
    // -------------------------
    createLayout() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(width/2, height/2, width, height, 0x1e1e2f);

        // 敵HP表示
        this.enemyText = this.add.text(width/2, 40, "", {
            fontSize: "24px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 山札
        this.deckText = this.add.text(width - 100, height/2, "", {
            fontSize: "20px",
            color: "#ffffff",
            backgroundColor: "#000"
        }).setPadding(10).setInteractive();

        this.deckText.on("pointerdown", () => {
            if (this.actionsLeft > 0) {
                this.actionsLeft--;
                this.drawCard(1);
            }
        });

        // ターン情報
        this.turnText = this.add.text(20, 20, "", {
            fontSize: "20px",
            color: "#ffffff"
        });

        // エンドターンボタン
        const endBtn = this.add.text(width - 140, height - 50, "END TURN", {
            fontSize: "22px",
            backgroundColor: "#550000",
            padding: { x: 10, y: 5 }
        }).setInteractive();

        endBtn.on("pointerdown", () => this.endTurn());

        this.updateUI();
    }

    // -------------------------
    // UI更新
    // -------------------------
    updateUI() {
        this.enemyText.setText("Enemy HP: " + this.enemyLife);
        this.turnText.setText("Turn: " + this.turn + "\nActions: " + this.actionsLeft);
        this.deckText.setText("Deck\n" + this.deck.length);
    }

    // -------------------------
    // ドロー
    // -------------------------
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

    // -------------------------
    // 手札描画
    // -------------------------
    renderHand() {

    if (this.handSprites) this.handSprites.forEach(s => s.destroy());
    this.handSprites = [];

    const startX = 300;
    const y = 500;

    this.hand.forEach((card, index) => {

        const sprite = this.add.image(startX + index * 170, y, card.key)
            .setDisplaySize(120, 170)   // ← 固定サイズ
            .setInteractive();

        sprite.on("pointerdown", () => this.summon(card));

        this.handSprites.push(sprite);
    });
}


    // -------------------------
    // 召喚
    // -------------------------
    summon(cardData) {

        if (this.actionsLeft <= 0) return;
        if (this.field.length >= 4) return;

        this.actionsLeft--;

        this.hand.splice(this.hand.indexOf(cardData), 1);

        // 召喚ターンは攻撃不可
        cardData.hasAttacked = true;

        this.field.push(cardData);

        this.renderHand();
        this.renderField();
        this.updateUI();
    }

    // -------------------------
    // フィールド描画
    // -------------------------
    renderField() {

    if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
    this.fieldSprites = [];

    const startX = 300;
    const y = 350;

    this.field.forEach((card, index) => {

        const sprite = this.add.image(startX + index * 170, y, card.key)
            .setDisplaySize(140, 200)  // ← 少し大きめ
            .setInteractive();

        sprite.on("pointerdown", () => this.attack(card, sprite));

        this.fieldSprites.push(sprite);
    });
}

    // -------------------------
    // 攻撃
    // -------------------------
    attack(cardData, cardSprite) {

        if (this.actionsLeft <= 0) return;
        if (cardData.hasAttacked) return;

        this.actionsLeft--;
        cardData.hasAttacked = true;

        this.enemyLife -= cardData.attack;
        this.updateUI();

        this.playAttackAnimation(cardSprite, cardData.attack);

        if (this.enemyLife <= 0) {
            this.time.delayedCall(1000, () => {
                this.showTurnBanner("VICTORY", "YOU WIN");
            });
        }
    }

    // -------------------------
    // ターン終了
    // -------------------------
    endTurn() {

        this.turn++;
        this.actionsLeft = 4;

        this.field.forEach(card => {
            card.hasAttacked = false;
        });

        this.updateUI();
        this.showTurnBanner("TURN " + this.turn, "START");
    }

    // -------------------------
    // ATTACK演出
    // -------------------------
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

        const dmgText = this.add.text(width / 2, height / 2 - 100, "-" + damage, {
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

    // -------------------------
    // ターンバナー
    // -------------------------
    showTurnBanner(mainText, subText) {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.4)
            .setOrigin(0);

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
    width: 1000,
    height: 600,
    scene: MainScene
};

new Phaser.Game(config);
