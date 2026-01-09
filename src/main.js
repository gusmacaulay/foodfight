import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log("Launcher initialized");
    const launcher = document.getElementById('launcher');
    const ui = document.getElementById('ui');
    const burgerBtn = document.getElementById('launch-burger');
    const gingerbreadBtn = document.getElementById('launch-gingerbread');

    if (burgerBtn) {
        burgerBtn.addEventListener('click', (e) => {
            console.log("Burger Game Selected via Card");
            launcher.style.display = 'none';
            ui.style.display = 'block';
            const game = new Game();
            game.start();
        });
    }
});
