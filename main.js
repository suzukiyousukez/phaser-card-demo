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

            sprite.on("pointerdown", () => this.summon(card));

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

    attack(cardData) {
        if (this.actionsLeft <= 0) return;
        if (cardData.hasAttacked) return;

        this.actionsLeft--;
        cardData.hasAttacked = true;
        this.enemyLife -= cardData.attack;

        this.updateUI();

        if (this.enemyLife <= 0) {
            this.add.text(300, 300, "VICTORY", {
                fontSize: "60px",
                color: "#22c55e"
            });
        }
    }

    endTurn() {
        this.turn++;
        this.actionsLeft = 4;

        this.field.forEach(card => card.hasAttacked = false);
        this.updateUI();
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
