class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.calculateValue();
    }

    calculateValue() {
        if (this.rank === 'A') return 11;
        if (['K', 'Q', 'J'].includes(this.rank)) return 10;
        return parseInt(this.rank);
    }

    toString() {
        return `${this.suit}${this.rank}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.cards = [];
        
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) this.reset();
        return this.cards.pop();
    }
}

class BlackjackGame {
    constructor() {
        this.deck = new Deck();
        this.playerHand = [];
        this.computerHand = [];
        this.playerField = [];
        this.computerField = [];
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameActive = false;
        this.isPlayerTurn = true;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startNewGame();
    }

    initializeElements() {
        this.playerScoreElement = document.getElementById('playerScore');
        this.computerScoreElement = document.getElementById('computerScore');
        this.playerHandElement = document.getElementById('playerHand');
        this.playerFieldElement = document.getElementById('playerField');
        this.computerFieldElement = document.getElementById('computerField');
        this.resultElement = document.getElementById('result');
        this.hitButton = document.getElementById('hitButton');
        this.standButton = document.getElementById('standButton');
        this.resetButton = document.getElementById('resetButton');
    }

    initializeEventListeners() {
        this.hitButton.addEventListener('click', () => this.hit());
        this.standButton.addEventListener('click', () => this.stand());
        this.resetButton.addEventListener('click', () => this.startNewGame());
    }

    startNewGame() {
        this.deck = new Deck();
        this.playerHand = [];
        this.computerHand = [];
        this.playerField = [];
        this.computerField = [];
        this.gameActive = true;
        this.isPlayerTurn = true;

        // 初期カードを配る
        this.playerHand = [this.deck.draw(), this.deck.draw(), this.deck.draw(), this.deck.draw(), this.deck.draw()];
        this.computerHand = [this.deck.draw(), this.deck.draw(), this.deck.draw(), this.deck.draw(), this.deck.draw()];
        
        this.updateDisplay();
        this.enableGameControls(true);
        this.resetButton.style.display = 'none';
        this.resultElement.textContent = '';
        this.showMessage('あなたのターン！カードを選んでください');
    }

    showMessage(message) {
        this.resultElement.textContent = message;
        this.resultElement.className = 'result-area';
    }

    hit() {
        if (!this.gameActive || !this.isPlayerTurn) return;

        if (this.playerField.length < 5) {
            this.enableGameControls(false);
            // カード選択のためのイベントリスナーを設定
            const handleCardClick = (event) => {
                const cardElement = event.currentTarget;
                const cardIndex = Array.from(this.playerHandElement.children).indexOf(cardElement);
                
                // 選択されたカードを場に移動
                const selectedCard = this.playerHand.splice(cardIndex, 1)[0];
                this.playerField.push(selectedCard);

                // 手札を5枚まで補充
                while (this.playerHand.length < 5) {
                    this.playerHand.push(this.deck.draw());
                }
                
                // イベントリスナーを削除
                this.playerHandElement.querySelectorAll('.card').forEach(card => {
                    card.removeEventListener('click', handleCardClick);
                    card.classList.remove('selectable');
                });
                
                this.updateDisplay();
                
                if (this.calculateHandValue(this.playerField) > 21) {
                    this.endGame('burst');
                } else {
                    // コンピューターのターンへ
                    this.isPlayerTurn = false;
                    this.showMessage('コンピューターのターン');
                    setTimeout(() => this.computerPlay(), 1000);
                }
            };

            // カードを選択可能にする
            this.playerHandElement.querySelectorAll('.card').forEach(card => {
                card.addEventListener('click', handleCardClick);
                card.classList.add('selectable');
            });
        }
    }

    stand() {
        if (!this.gameActive || !this.isPlayerTurn) return;
        this.isPlayerTurn = false;
        this.showMessage('コンピューターのターン');
        setTimeout(() => this.computerPlay(), 1000);
    }

    computerPlay() {
        if (!this.gameActive || this.computerField.length >= 5) {
            this.determineWinner();
            return;
        }

        // コンピュータのAI：戦略的にカードを選択
        const currentValue = this.calculateHandValue(this.computerField);
        const playerValue = this.calculateHandValue(this.playerField);
        let bestCardIndex = 0;
        let bestValue = -1;
        
        // より賢い戦略を実装
        this.computerHand.forEach((card, index) => {
            const potentialValue = this.calculateHandValue([...this.computerField, card]);
            
            // ブラックジャックに近づくための戦略
            if (potentialValue <= 21) {
                // プレイヤーの点数が17未満の場合、積極的に高い点数を狙う
                if (playerValue < 17 && potentialValue > bestValue && potentialValue <= 21) {
                    bestValue = potentialValue;
                    bestCardIndex = index;
                }
                // プレイヤーの点数が17以上の場合、プレイヤーの点数を超えることを目指す
                else if (playerValue >= 17) {
                    if (potentialValue > playerValue && potentialValue <= 21) {
                        bestValue = potentialValue;
                        bestCardIndex = index;
                    } else if (potentialValue > bestValue && potentialValue <= 21) {
                        bestValue = potentialValue;
                        bestCardIndex = index;
                    }
                }
                // 現在の手が16以下の場合は必ずカードを引く
                else if (currentValue <= 16 && potentialValue > bestValue) {
                    bestValue = potentialValue;
                    bestCardIndex = index;
                }
            }
        });

        // カードを選択して場に出す
        const selectedCard = this.computerHand.splice(bestCardIndex, 1)[0];
        this.computerField.push(selectedCard);

        // 手札を5枚まで補充
        while (this.computerHand.length < 5) {
            this.computerHand.push(this.deck.draw());
        }
        
        this.updateDisplay();

        const newValue = this.calculateHandValue(this.computerField);
        // バーストした場合または21に到達した場合は終了
        if (newValue > 21) {
            this.endGame('win');
        } else if (newValue === 21 || this.computerField.length === 5) {
            this.determineWinner();
        } else {
            // 17以上の場合はスタンド、それ以外はプレイヤーのターン
            if (newValue >= 17) {
                this.determineWinner();
            } else {
                this.isPlayerTurn = true;
                this.enableGameControls(true);
                this.showMessage('あなたのターン！カードを選んでください');
            }
        }
    }

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            if (card.rank === 'A') {
                aces += 1;
            }
            value += card.value;
        }

        while (value > 21 && aces > 0) {
            value -= 10;
            aces -= 1;
        }

        return value;
    }

    determineWinner() {
        const playerValue = this.calculateHandValue(this.playerField);
        const computerValue = this.calculateHandValue(this.computerField);
        const playerHasBlackjack = this.playerField.length === 2 && playerValue === 21;
        const computerHasBlackjack = this.computerField.length === 2 && computerValue === 21;

        let result;
        if (playerValue > 21) {
            result = 'burst';
            this.computerScore++;
        } else if (computerValue > 21) {
            result = 'win';
            this.playerScore++;
        } else if (playerHasBlackjack && !computerHasBlackjack) {
            result = 'blackjack';
            this.playerScore += 2; // ブラックジャックはボーナスポイント
        } else if (!playerHasBlackjack && computerHasBlackjack) {
            result = 'lose';
            this.computerScore += 2;
        } else if (playerValue > computerValue) {
            result = 'win';
            this.playerScore++;
        } else if (playerValue < computerValue) {
            result = 'lose';
            this.computerScore++;
        } else {
            result = 'draw';
        }

        this.endGame(result);
    }

    endGame(result) {
        this.gameActive = false;
        this.enableGameControls(false);
        this.resetButton.style.display = 'block';

        let resultText = '';
        let resultClass = '';

        switch(result) {
            case 'blackjack':
                resultText = 'ブラックジャック！🎰';
                resultClass = 'win';
                this.showWinAnimation();
                break;
            case 'win':
                resultText = '勝利！🎉';
                resultClass = 'win';
                this.showWinAnimation();
                break;
            case 'lose':
                resultText = '負け...💀';
                resultClass = 'lose';
                this.showLoseAnimation();
                break;
            case 'draw':
                resultText = '引き分け🤝';
                resultClass = 'draw';
                break;
            case 'burst':
                resultText = 'バースト！💥';
                resultClass = 'lose';
                this.showLoseAnimation();
                break;
        }

        this.resultElement.textContent = resultText;
        this.resultElement.className = `result-area ${resultClass}`;
        this.updateScores();
    }

    showWinAnimation() {
        // 勝利エフェクト
        const victoryEffect = document.createElement('div');
        victoryEffect.className = 'victory-effect';
        document.body.appendChild(victoryEffect);
        setTimeout(() => victoryEffect.remove(), 2000);

        // 紙吹雪エフェクト
        this.createConfetti();
    }

    showLoseAnimation() {
        // 敗北エフェクト
        const defeatEffect = document.createElement('div');
        defeatEffect.className = 'defeat-effect';
        document.body.appendChild(defeatEffect);
        setTimeout(() => defeatEffect.remove(), 2000);

        // 死神エフェクト
        const reaper = document.createElement('div');
        reaper.className = 'reaper';
        document.body.appendChild(reaper);
        setTimeout(() => reaper.remove(), 2000);
    }

    createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}deg, 100%, 50%)`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    enableGameControls(enabled) {
        this.hitButton.disabled = !enabled;
        this.standButton.disabled = !enabled;
    }

    updateScores() {
        this.playerScoreElement.textContent = this.playerScore;
        this.computerScoreElement.textContent = this.computerScore;
    }

    createCardElement(card, hidden = false) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card.toString();
        cardElement.dataset.suit = card.suit;
        cardElement.style.color = ['♥', '♦'].includes(card.suit) ? 'var(--secondary)' : '#000000';
        return cardElement;
    }

    updateDisplay() {
        // プレイヤーの手札を表示
        this.playerHandElement.innerHTML = '';
        this.playerHand.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.playerHandElement.appendChild(cardElement);
        });

        // プレイヤーのフィールドを表示
        this.playerFieldElement.innerHTML = '';
        this.playerField.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.playerFieldElement.appendChild(cardElement);
        });

        // コンピューターのフィールドを表示
        this.computerFieldElement.innerHTML = '';
        this.computerField.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.computerFieldElement.appendChild(cardElement);
        });
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    new BlackjackGame();
});
