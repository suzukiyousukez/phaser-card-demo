class UIHelper {

    static createPanel(scene, x, y, width, height) {
        const panel = scene.add.rectangle(x, y, width, height, 0x1f2937);
        panel.setStrokeStyle(2, 0xffffff);
        panel.setOrigin(0);
        return panel;
    }

    static createButton(scene, x, y, width, height, label, callback) {

        const button = scene.add.rectangle(x, y, width, height, 0x374151)
            .setStrokeStyle(2, 0xffffff)
            .setOrigin(0.5)
            .setInteractive();

        const text = scene.add.text(x, y, label, {
            fontSize: "18px",
            color: "#ffffff"
        }).setOrigin(0.5);

        button.on("pointerover", () => button.setFillStyle(0x4b5563));
        button.on("pointerout", () => button.setFillStyle(0x374151));
        button.on("pointerdown", callback);

        return { button, text };
    }
}
