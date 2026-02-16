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

    this.turn = 1;
    this.actionsLeft = 4;
    this.enemyLife = 40;

    this.hand = [];
    this.field = [];

    this.createDeck();      // ← 先にデッキ作る
    this.createLayout();    // ← そのあとUI作る
    this.drawCard(4);
    this.showTurnBanner("TURN " + this.turn, "DRAW");

}


    createLayout() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 上部情報パネル
        UIHelper.createPanel(this, 10, 10, width - 20, 80);

        this.turnText = this.add.text(30, 30, "", { fontSize: "20px" });
        this.actionText = this.add.text(200, 30, "", { fontSize: "20px" });
        this.enemyLifeText = this.add.text(width - 250, 30, "", {
            fontSize: "22px",
            color: "#ff6666"
        });

        // フィールド枠
        this.fieldSlots = [];
        const spacing = 170;
        for (let i = 0; i < 4; i++) {
            let x = width / 2 + (i - 1.5) * spacing;
            let slot = this.add.rectangle(x, height / 2, 130, 170, 0x111827)
                .setStrokeStyle(2, 0xffffff);
            this.fieldSlots.push(slot);
        }

        // 山札パネル
        UIHelper.createPanel(this, width - 150, 110, 130, 170);
        this.deckText = this.add.text(width - 135, 120, "", { fontSize: "18px" });

        this.deckZone = this.add.rectangle(width - 85, 200, 80, 110, 0x374151)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .on("pointerdown", () => this.drawCard());

        // ターン終了ボタン
        UIHelper.createButton(this, width - 100, height - 50, 160, 50, "ターン終了", () => {
            this.endTurn();
        });

        this.updateUI();
    }

    createDeck() {
        this.deck = [];
        for (let i = 0; i < 20; i++) {
            this.deck.push({
                key: "card" + Phaser.Math.Between(1, 5),
                attack: Phaser.Math.Between(3, 8),
                hasAttacked: false
            });
        }
        Phaser.Utils.Array.Shuffle(this.deck);
    }

    updateUI() {
        this.turnText.setText(`ターン: ${this.turn}`);
        this.actionText.setText(`行動: ${this.actionsLeft}/4`);
        this.enemyLifeText.setText(`敵HP: ${this.enemyLife}`);
        this.deckText.setText(`山札\n${this.deck.length}`);
    }

   drawCard(count = 1) {
    for (let i = 0; i < count; i++) {

        if (this.hand.length >= 4) {
            console.log("手札上限");
            break;
        }

        if (this.deck.length === 0) return;

        const card = this.deck.pop();
        this.hand.push(card);
    }

    this.renderHand();
    this.updateUI();
}

    showTurnBanner(mainText, subText) {

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 画面暗転レイヤー
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.4)
        .setOrigin(0);

    // 横帯
    const bar = this.add.rectangle(width/2, height/2, width, 140, 0x000000, 0.75);

    bar.setStrokeStyle(2, 0xffd700);

    // メインテキスト
    const title = this.add.text(width/2, height/2 - 20, mainText, {
        fontSize: "64px",
        fontStyle: "bold",
        color: "#ffffff"
    }).setOrigin(0.5);

    // サブテキスト
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


    renderHand() {
        if (this.handSprites) this.handSprites.forEach(s => s.destroy());
        this.handSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const spacing = 150;

        this.hand.forEach((card, index) => {

            let x = width / 2 + (index - (this.hand.length - 1) / 2) * spacing;
            let y = height - 110;

            let sprite = this.add.image(x, y, card.key);
            let scale = 150 / sprite.height;
            sprite.setScale(scale);
            sprite.setInteractive();

            sprite.on("pointerdown", () => this.attack(card, sprite));

            this.handSprites.push(sprite);
        });
    }

    summon(cardData) {
        if (this.actionsLeft <= 0) return;
        if (this.field.length >= 4) return;

        this.actionsLeft--;
        this.hand.splice(this.hand.indexOf(cardData), 1);
        cardData.hasAttacked = false;
        this.field.push(cardData);

        this.updateUI();
        this.renderHand();
        this.renderField();
    }

    renderField() {
        if (this.fieldSprites) this.fieldSprites.forEach(s => s.destroy());
        this.fieldSprites = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const spacing = 170;

        this.field.forEach((card, index) => {

            let x = width / 2 + (index - (this.field.length - 1) / 2) * spacing;
            let y = height / 2;

            let sprite = this.add.image(x, y, card.key);
            let scale = 170 / sprite.height;
            sprite.setScale(scale);
            sprite.setInteractive();

            sprite.on("pointerdown", () => this.attack(card));

            this.add.text(x - 45, y + 80, `ATK ${card.attack}`, {
                fontSize: "18px",
                color: "#facc15"
            });

            this.fieldSprites.push(sprite);
        });
    }

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


    playAttackAnimation(cardSprite, damage) {

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 入力一時停止
    this.input.enabled = false;

    // ① カードを前に出す
    this.tweens.add({
        targets: cardSprite,
        y: cardSprite.y - 40,
        duration: 150,
        yoyo: true
    });

    // ② 画面フラッシュ
    const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 0.2)
        .setOrigin(0);

    this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy()
    });

    // ③ ATTACKバナー
    this.showTurnBanner("ATTACK", "-" + damage);

    // ④ ダメージ数字ポップ
    const dmgText = this.add.text(width / 2, height / 2 - 120, "-" + damage, {
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

    
    endTurn() {

    this.turn++;
    this.actionsLeft = 4;

    this.field.forEach(card => card.hasAttacked = false);

    this.updateUI();

    this.showTurnBanner("TURN " + this.turn, "START");
}
}

const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 650,
    backgroundColor: "#111827",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: MainScene
};

new Phaser.Game(config);
