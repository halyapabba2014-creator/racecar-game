class LuxuryCarRacingGame {
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
        this.obstacleSpawnRate = 0.006;
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
        // Create background scenery
        for (let i = 0; i < 20; i++) {
            this.backgroundElements.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                type: Math.random() > 0.5 ? 'tree' : 'building',
                size: Math.random() * 30 + 20,
                speed: Math.random() * 0.5 + 0.2
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
            
            this.player.x += deltaX * 0.5;
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
        
        // Car selection
        document.querySelectorAll('.car-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.car-option').forEach(opt => opt.classList.remove('active'));
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
            document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">▶️</span><span>Resume</span>';
            cancelAnimationFrame(this.animationId);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">⏸️</span><span>Pause</span>';
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
        document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">⏸️</span><span>Pause</span>';
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
        if (this.weatherTimer > 30000) { // 30 seconds
            this.weatherTimer = 0;
            const weathers = ['sunny', 'rainy', 'cloudy'];
            this.weather = weathers[Math.floor(Math.random() * weathers.length)];
            this.updateWeatherDisplay();
        }
        
        // Day/night cycle
        this.dayTimer += deltaTime;
        if (this.dayTimer > 60000) { // 1 minute
            this.dayTimer = 0;
            this.timeOfDay = this.timeOfDay === 'day' ? 'night' : 'day';
            this.updateTimeDisplay();
        }
    }
    
    updateWeatherDisplay() {
        const weatherIcons = {
            sunny: '☀️',
            rainy: '🌧️',
            cloudy: '☁️'
        };
        document.getElementById('weatherIcon').textContent = weatherIcons[this.weather];
    }
    
    updateTimeDisplay() {
        document.getElementById('timeDisplay').textContent = this.timeOfDay === 'day' ? 'Day' : 'Night';
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
        const minSpawnInterval = 2000;
        
        if (Math.random() < this.obstacleSpawnRate && timeSinceLastSpawn > minSpawnInterval) {
            const lane = Math.floor(Math.random() * this.road.lanes);
            const x = this.road.x + lane * this.road.laneWidth + (this.road.laneWidth - 40) / 2;
            const carData = this.getRandomLuxuryCar();
            
            this.obstacles.push({
                x: x,
                y: -80,
                width: 40,
                height: 80,
                speed: this.obstacleSpeed + Math.random() * 1.5,
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
                this.score += 30;
                this.coins += Math.floor(Math.random() * 3) + 1;
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
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 30,
                maxLife: 30,
                alpha: 1,
                size: Math.random() * 3 + 2
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
        document.getElementById('finalSpeed').textContent = this.speed;
        document.getElementById('finalCoins').textContent = this.coins;
        
        // Show achievements
        this.showAchievements();
        
        document.getElementById('gameOver').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
    }
    
    showAchievements() {
        const achievements = [];
        if (this.carsAvoided >= 10) achievements.push('🏆 Speed Demon');
        if (this.score >= 1000) achievements.push('💰 High Roller');
        if (this.speed >= 5) achievements.push('⚡ Speed Master');
        if (this.coins >= 50) achievements.push('💎 Coin Collector');
        
        const achievementsDiv = document.getElementById('achievements');
        achievementsDiv.innerHTML = '';
        achievements.forEach(achievement => {
            const div = document.createElement('div');
            div.className = 'achievement';
            div.textContent = achievement;
            achievementsDiv.appendChild(div);
        });
    }
    
    updateScore() {
        this.score += Math.floor(this.gameSpeed * 0.3);
    }
    
    increaseDifficulty() {
        if (this.score > 0 && this.score % 500 === 0) {
            this.speed = Math.min(10, Math.floor(this.score / 500) + 1);
            this.gameSpeed = Math.min(5, 2 + this.score / 3000);
            this.obstacleSpawnRate = Math.min(0.012, 0.006 + this.score / 20000);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('speed').textContent = this.speed;
        document.getElementById('carsAvoided').textContent = this.carsAvoided;
        document.getElementById('coins').textContent = this.coins;
        
        // Update speed indicator
        const speedFill = document.getElementById('speedFill');
        const speedPercent = (this.speed / 10) * 100;
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
        // Dynamic background based on time and weather
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
        
        // Weather effects
        if (this.weather === 'rainy') {
            this.drawRain();
        }
    }
    
    drawRain() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Math.random() * this.canvas.height + Date.now() * 0.1) % this.canvas.height;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 2, y + 10);
            this.ctx.stroke();
        }
    }
    
    drawBackgroundElements() {
        for (const element of this.backgroundElements) {
            this.ctx.fillStyle = this.timeOfDay === 'night' ? '#2c3e50' : '#27ae60';
            if (element.type === 'tree') {
                this.ctx.fillRect(element.x, element.y, element.size, element.size);
            } else {
                this.ctx.fillRect(element.x, element.y, element.size, element.size * 1.5);
            }
        }
    }
    
    drawRoad() {
        // Road background
        this.ctx.fillStyle = this.timeOfDay === 'night' ? '#34495e' : '#2c3e50';
        this.ctx.fillRect(this.road.x, 0, this.road.width, this.canvas.height);
        
        // Road markings
        this.ctx.strokeStyle = this.timeOfDay === 'night' ? '#f1c40f' : '#f39c12';
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
        // Car body with luxury styling
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 10);
        this.ctx.fill();
        
        // Luxury shine effect
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Car outline
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Windshield
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
        this.ctx.fillRect(x + 5, y + 8, width - 10, 20);
        
        // Side windows
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.fillRect(x + 3, y + 12, 8, 15);
        this.ctx.fillRect(x + width - 11, y + 12, 8, 15);
        
        // Luxury headlights
        this.ctx.fillStyle = accent;
        this.ctx.shadowColor = accent;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x + 8, y + 5, 4, 0, Math.PI * 2);
        this.ctx.arc(x + width - 8, y + 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Luxury grille
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(x + 12, y + 2, width - 24, 5);
        
        // Luxury wheels with chrome rims
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 20, 7, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 20, 7, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 20, 7, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 20, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Chrome rims
        this.ctx.fillStyle = accent;
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y + 20, 5, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + 20, 5, 0, Math.PI * 2);
        this.ctx.arc(x - 2, y + height - 20, 5, 0, Math.PI * 2);
        this.ctx.arc(x + width + 2, y + height - 20, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Brand logo
        if (isPlayer) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏎️', x + width/2, y + height/2 + 3);
        }
        
        // Side mirrors
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 3, y + 8, 2, 5);
        this.ctx.fillRect(x + width + 1, y + 8, 2, 5);
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
        // Speed lines
        if (this.gameSpeed > 2) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 2;
            
            for (let i = 0; i < 8; i++) {
                const x = this.road.x + Math.random() * this.road.width;
                const y = Math.random() * this.canvas.height;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - 25, y + 25);
                this.ctx.stroke();
            }
        }
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Rajdhani';
        this.ctx.fillText('Press Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new LuxuryCarRacingGame();
    game.draw();
});