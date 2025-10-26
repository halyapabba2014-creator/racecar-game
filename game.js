class CarRacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.speed = 1;
        this.gameSpeed = 2;
        this.lastTime = 0;
        this.animationId = null;
        this.carsAvoided = 0;
        
        // Player car
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 100,
            width: 50,
            height: 80,
            speed: 5,
            color: '#e74c3c',
            brand: 'Ferrari'
        };
        
        // Obstacles
        this.obstacles = [];
        this.obstacleSpawnRate = 0.008; // Reduced spawn rate for better balance
        this.obstacleSpeed = 2;
        this.lastObstacleSpawn = 0;
        
        // Road
        this.road = {
            width: 300,
            x: (this.canvas.width - 300) / 2,
            lanes: 3,
            laneWidth: 100
        };
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        this.setupUI();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchStartX = touch.clientX - rect.left;
            this.touchStartY = touch.clientY - rect.top;
            this.isDragging = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDragging || this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const deltaX = touchX - this.touchStartX;
            
            // Move player car based on touch movement
            this.player.x += deltaX * 0.5;
            this.touchStartX = touchX;
            
            // Keep player within road boundaries
            this.constrainPlayerToRoad();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // Mouse controls for desktop
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.touchStartX = e.clientX - rect.left;
            this.touchStartY = e.clientY - rect.top;
            this.isDragging = true;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.gameState !== 'playing') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const deltaX = mouseX - this.touchStartX;
            
            this.player.x += deltaX * 0.3;
            this.touchStartX = mouseX;
            
            this.constrainPlayerToRoad();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        this.gameLoop();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').textContent = 'Resume';
            cancelAnimationFrame(this.animationId);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').textContent = 'Pause';
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.speed = 1;
        this.gameSpeed = 2;
        this.carsAvoided = 0;
        this.obstacles = [];
        this.player.x = this.canvas.width / 2 - 25;
        this.player.y = this.canvas.height - 100;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('gameOver').classList.add('hidden');
        
        this.updateUI();
        this.draw();
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.handleInput();
        this.updateObstacles();
        this.spawnObstacles();
        this.checkCollisions();
        this.updateScore();
        this.increaseDifficulty();
    }
    
    handleInput() {
        // Keyboard controls
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.x += this.player.speed;
        }
        
        this.constrainPlayerToRoad();
    }
    
    constrainPlayerToRoad() {
        const minX = this.road.x;
        const maxX = this.road.x + this.road.width - this.player.width;
        this.player.x = Math.max(minX, Math.min(maxX, this.player.x));
    }
    
    spawnObstacles() {
        // Improved spawning logic with better spacing
        const currentTime = Date.now();
        const timeSinceLastSpawn = currentTime - this.lastObstacleSpawn;
        const minSpawnInterval = 1500; // Minimum 1.5 seconds between spawns
        
        if (Math.random() < this.obstacleSpawnRate && timeSinceLastSpawn > minSpawnInterval) {
            const lane = Math.floor(Math.random() * this.road.lanes);
            const x = this.road.x + lane * this.road.laneWidth + (this.road.laneWidth - 40) / 2;
            const carData = this.getRandomCar();
            
            this.obstacles.push({
                x: x,
                y: -80,
                width: 40,
                height: 80,
                speed: this.obstacleSpeed + Math.random() * 1.5, // Reduced speed variation
                color: carData.color,
                accent: carData.accent,
                brand: carData.brand
            });
            
            this.lastObstacleSpawn = currentTime;
        }
    }
    
    getRandomCar() {
        const carBrands = [
            { brand: 'BMW', color: '#2c3e50', accent: '#f39c12' },
            { brand: 'Mercedes', color: '#34495e', accent: '#ecf0f1' },
            { brand: 'Audi', color: '#e74c3c', accent: '#f1c40f' },
            { brand: 'Porsche', color: '#2c3e50', accent: '#e74c3c' },
            { brand: 'Lamborghini', color: '#f39c12', accent: '#2c3e50' },
            { brand: 'Tesla', color: '#34495e', accent: '#3498db' },
            { brand: 'Toyota', color: '#e67e22', accent: '#ecf0f1' },
            { brand: 'Honda', color: '#2ecc71', accent: '#2c3e50' }
        ];
        return carBrands[Math.floor(Math.random() * carBrands.length)];
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += obstacle.speed * this.gameSpeed;
            
            // Remove obstacles that are off screen
            if (obstacle.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
                this.carsAvoided++;
                this.score += 25; // Better score for avoiding obstacles
            }
        }
    }
    
    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCarsAvoided').textContent = this.carsAvoided;
        document.getElementById('finalSpeed').textContent = this.speed;
        document.getElementById('gameOver').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
    }
    
    updateScore() {
        // Better scoring system
        this.score += Math.floor(this.gameSpeed * 0.5); // Reduced base score
    }
    
    increaseDifficulty() {
        // More balanced difficulty progression
        if (this.score > 0 && this.score % 500 === 0) {
            this.speed = Math.min(8, Math.floor(this.score / 500) + 1);
            this.gameSpeed = Math.min(4, 2 + this.score / 3000);
            this.obstacleSpawnRate = Math.min(0.015, 0.008 + this.score / 15000);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('speed').textContent = this.speed;
        document.getElementById('carsAvoided').textContent = this.carsAvoided;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawRoad();
        this.drawPlayer();
        this.drawObstacles();
        this.drawEffects();
        
        if (this.gameState === 'paused') {
            this.drawPauseScreen();
        }
    }
    
    drawRoad() {
        // Road background
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(this.road.x, 0, this.road.width, this.canvas.height);
        
        // Road markings
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        for (let i = 1; i < this.road.lanes; i++) {
            const x = this.road.x + i * this.road.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
        
        // Road edges
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.road.x, 0, this.road.width, this.canvas.height);
    }
    
    drawPlayer() {
        this.drawRealisticCar(this.player.x, this.player.y, this.player.width, this.player.height, 
                             this.player.color, '#f1c40f', this.player.brand, true);
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.drawRealisticCar(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 
                                 obstacle.color, obstacle.accent, obstacle.brand, false);
        }
    }
    
    drawRealisticCar(x, y, width, height, color, accent, brand, isPlayer) {
        // Car body with rounded corners
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.fill();
        
        // Car shadow/outline
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Windshield
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.fillRect(x + 5, y + 8, width - 10, 18);
        
        // Side windows
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        this.ctx.fillRect(x + 3, y + 12, 8, 12);
        this.ctx.fillRect(x + width - 11, y + 12, 8, 12);
        
        // Headlights
        this.ctx.fillStyle = accent;
        this.ctx.beginPath();
        this.ctx.arc(x + 8, y + 5, 3, 0, Math.PI * 2);
        this.ctx.arc(x + width - 8, y + 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Grille
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(x + 12, y + 2, width - 24, 4);
        
        // Wheels with rims
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 18, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wheel rims
        this.ctx.fillStyle = accent;
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 18, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Brand logo (simplified)
        if (isPlayer) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏎️', x + width/2, y + height/2 + 3);
        }
        
        // Side mirrors
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 3, y + 8, 2, 4);
        this.ctx.fillRect(x + width + 1, y + 8, 2, 4);
    }
    
    drawEffects() {
        // Speed lines effect
        if (this.gameSpeed > 2) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            
            for (let i = 0; i < 5; i++) {
                const x = this.road.x + Math.random() * this.road.width;
                const y = Math.random() * this.canvas.height;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - 20, y + 20);
                this.ctx.stroke();
            }
        }
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new CarRacingGame();
    game.draw(); // Draw initial menu state
});
