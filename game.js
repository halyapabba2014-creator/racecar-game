class CleanLuxuryRacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game state
        this.gameState = 'menu';
        this.score = 0;
        this.speed = 1;
        this.gameSpeed = 2;
        this.coins = 0;
        this.lastTime = 0;
        this.animationId = null;
        this.carsAvoided = 0;
        this.selectedCar = 'ferrari';
        
        // Real-time features
        this.timeOfDay = 'day';
        this.weather = 'sunny';
        this.weatherTimer = 0;
        this.dayTimer = 0;
        this.particles = [];
        
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
        this.obstacleSpawnRate = 0.005;
        this.obstacleSpeed = 2;
        this.lastObstacleSpawn = 0;
        
        // Road
        this.road = {
            width: 300,
            x: (this.canvas.width - 300) / 2,
            lanes: 3,
            laneWidth: 100
        };
        
        // Background elements
        this.backgroundElements = [];
        this.initBackgroundElements();
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        this.setupUI();
    }
    
    initBackgroundElements() {
        for (let i = 0; i < 15; i++) {
            this.backgroundElements.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                type: Math.random() > 0.5 ? 'tree' : 'building',
                size: Math.random() * 25 + 15,
                speed: Math.random() * 0.3 + 0.1
            });
        }
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
        
        // Touch controls
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
            
            this.player.x += deltaX * 0.6;
            this.touchStartX = touchX;
            this.constrainPlayerToRoad();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // Mouse controls
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
            
            this.player.x += deltaX * 0.4;
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
        
        // Car selection
        document.querySelectorAll('.car').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.car').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.selectedCar = option.dataset.car;
                this.updatePlayerCar();
            });
        });
    }
    
    updatePlayerCar() {
        const carData = this.getLuxuryCar(this.selectedCar);
        this.player.color = carData.color;
        this.player.brand = carData.brand;
    }
    
    getLuxuryCar(brand) {
        const luxuryCars = {
            ferrari: { brand: 'Ferrari', color: '#e74c3c', accent: '#f1c40f' },
            lamborghini: { brand: 'Lamborghini', color: '#f39c12', accent: '#2c3e50' },
            porsche: { brand: 'Porsche', color: '#2c3e50', accent: '#e74c3c' },
            mclaren: { brand: 'McLaren', color: '#3498db', accent: '#f1c40f' }
        };
        return luxuryCars[brand] || luxuryCars.ferrari;
    }
    
    getRandomLuxuryCar() {
        const luxuryCars = [
            { brand: 'BMW', color: '#2c3e50', accent: '#f39c12' },
            { brand: 'Mercedes', color: '#34495e', accent: '#ecf0f1' },
            { brand: 'Audi', color: '#e74c3c', accent: '#f1c40f' },
            { brand: 'Porsche', color: '#2c3e50', accent: '#e74c3c' },
            { brand: 'Lamborghini', color: '#f39c12', accent: '#2c3e50' },
            { brand: 'Tesla', color: '#34495e', accent: '#3498db' },
            { brand: 'Bentley', color: '#8b4513', accent: '#daa520' },
            { brand: 'Rolls Royce', color: '#2c3e50', accent: '#ecf0f1' }
        ];
        return luxuryCars[Math.floor(Math.random() * luxuryCars.length)];
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
        this.coins = 0;
        this.carsAvoided = 0;
        this.obstacles = [];
        this.particles = [];
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
        this.updateRealTimeFeatures(deltaTime);
        this.updateObstacles();
        this.spawnObstacles();
        this.updateParticles();
        this.updateBackground();
        this.checkCollisions();
        this.updateScore();
        this.increaseDifficulty();
    }
    
    updateRealTimeFeatures(deltaTime) {
        // Weather changes
        this.weatherTimer += deltaTime;
        if (this.weatherTimer > 25000) {
            this.weatherTimer = 0;
            const weathers = ['sunny', 'rainy', 'cloudy'];
            this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
        
        // Day/night cycle
        this.dayTimer += deltaTime;
        if (this.dayTimer > 45000) {
            this.dayTimer = 0;
            this.timeOfDay = this.timeOfDay === 'day' ? 'night' : 'day';
        }
    }
    
    handleInput() {
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
        const currentTime = Date.now();
        const timeSinceLastSpawn = currentTime - this.lastObstacleSpawn;
        const minSpawnInterval = 1800;
        
        if (Math.random() < this.obstacleSpawnRate && timeSinceLastSpawn > minSpawnInterval) {
            const lane = Math.floor(Math.random() * this.road.lanes);
            const x = this.road.x + lane * this.road.laneWidth + (this.road.laneWidth - 40) / 2;
            const carData = this.getRandomLuxuryCar();
            
            this.obstacles.push({
                x: x,
                y: -80,
                width: 40,
                height: 80,
                speed: this.obstacleSpeed + Math.random() * 1.2,
                color: carData.color,
                accent: carData.accent,
                brand: carData.brand
            });
            
            this.lastObstacleSpawn = currentTime;
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += obstacle.speed * this.gameSpeed;
            
            if (obstacle.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
                this.carsAvoided++;
                this.score += 25;
                this.coins += Math.floor(Math.random() * 2) + 1;
                this.addParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 'coin');
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    addParticles(x, y, type) {
        const colors = type === 'coin' ? ['#FFD700', '#FFA500'] : ['#e74c3c', '#f39c12'];
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 25,
                maxLife: 25,
                alpha: 1,
                size: Math.random() * 2 + 1
            });
        }
    }
    
    updateBackground() {
        for (const element of this.backgroundElements) {
            element.y += element.speed * this.gameSpeed;
            if (element.y > this.canvas.height) {
                element.y = -element.size;
                element.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.addParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 'crash');
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
        document.getElementById('finalCoins').textContent = this.coins;
        
        document.getElementById('gameOver').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
    }
    
    updateScore() {
        this.score += Math.floor(this.gameSpeed * 0.2);
    }
    
    increaseDifficulty() {
        if (this.score > 0 && this.score % 400 === 0) {
            this.speed = Math.min(8, Math.floor(this.score / 400) + 1);
            this.gameSpeed = Math.min(4, 2 + this.score / 2500);
            this.obstacleSpawnRate = Math.min(0.008, 0.005 + this.score / 15000);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('speed').textContent = this.speed;
        document.getElementById('coins').textContent = this.coins;
        
        // Update speed indicator
        const speedFill = document.getElementById('speedFill');
        const speedPercent = (this.speed / 8) * 100;
        speedFill.style.height = speedPercent + '%';
    }
    
    draw() {
        this.drawBackground();
        this.drawRoad();
        this.drawBackgroundElements();
        this.drawPlayer();
        this.drawObstacles();
        this.drawParticles();
        this.drawEffects();
        
        if (this.gameState === 'paused') {
            this.drawPauseScreen();
        }
        
        this.updateUI();
    }
    
    drawBackground() {
        let gradient;
        if (this.timeOfDay === 'night') {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
        } else {
            if (this.weather === 'rainy') {
                gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4682B4');
            } else if (this.weather === 'cloudy') {
                gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#B0C4DE');
                gradient.addColorStop(1, '#708090');
            } else {
                gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.3, '#98FB98');
                gradient.addColorStop(1, '#90EE90');
            }
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.weather === 'rainy') {
            this.drawRain();
        }
    }
    
    drawRain() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Math.random() * this.canvas.height + Date.now() * 0.05) % this.canvas.height;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 1, y + 8);
            this.ctx.stroke();
        }
    }
    
    drawBackgroundElements() {
        for (const element of this.backgroundElements) {
            this.ctx.fillStyle = this.timeOfDay === 'night' ? '#2c3e50' : '#27ae60';
            if (element.type === 'tree') {
                this.ctx.fillRect(element.x, element.y, element.size, element.size);
            } else {
                this.ctx.fillRect(element.x, element.y, element.size, element.size * 1.3);
            }
        }
    }
    
    drawRoad() {
        this.ctx.fillStyle = this.timeOfDay === 'night' ? '#34495e' : '#2c3e50';
        this.ctx.fillRect(this.road.x, 0, this.road.width, this.canvas.height);
        
        this.ctx.strokeStyle = this.timeOfDay === 'night' ? '#f1c40f' : '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([15, 15]);
        
        for (let i = 1; i < this.road.lanes; i++) {
            const x = this.road.x + i * this.road.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.road.x, 0, this.road.width, this.canvas.height);
    }
    
    drawPlayer() {
        this.drawLuxuryCar(this.player.x, this.player.y, this.player.width, this.player.height, 
                          this.player.color, '#f1c40f', this.player.brand, true);
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.drawLuxuryCar(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 
                              obstacle.color, obstacle.accent, obstacle.brand, false);
        }
    }
    
    drawLuxuryCar(x, y, width, height, color, accent, brand, isPlayer) {
        // Car body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.fill();
        
        // Shine effect
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Outline
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Windshield
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.fillRect(x + 5, y + 8, width - 10, 18);
        
        // Headlights
        this.ctx.fillStyle = accent;
        this.ctx.shadowColor = accent;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(x + 8, y + 5, 3, 0, Math.PI * 2);
        this.ctx.arc(x + width - 8, y + 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Wheels
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 18, 6, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 18, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rims
        this.ctx.fillStyle = accent;
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 18, 4, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 18, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Brand logo
        if (isPlayer) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏎️', x + width/2, y + height/2 + 2);
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawEffects() {
        if (this.gameSpeed > 2) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            
            for (let i = 0; i < 6; i++) {
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
        this.ctx.font = 'bold 36px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '18px Inter';
        this.ctx.fillText('Press Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new CleanLuxuryRacingGame();
    game.draw();
});