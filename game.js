class RedMansionGame {
    constructor() {
        this.currentScene = '初入贾府';  // 改为使用title
        this.luck = 50;
        this.scenes = {};
        this.initializeGame();
    }

    async initializeGame() {
        await this.loadAllScenes();
        this.displayScene(this.currentScene);
        this.updateLuckDisplay();
    }

    async loadAllScenes() {
        try {
            // 动态获取Scenes目录下的所有JSON文件
            const response = await fetch('Scenes/');
            const html = await response.text();
            
            // 解析HTML内容，提取所有.json文件的名称
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const fileLinks = doc.querySelectorAll('a[href$=".json"]');
            const sceneFiles = Array.from(fileLinks).map(link => link.getAttribute('href'));
            
            // 加载所有场景文件
            for (const file of sceneFiles) {
                const sceneResponse = await fetch(`Scenes/${file}`);
                if (sceneResponse.ok) {
                    const scene = await sceneResponse.json();
                    this.scenes[scene.title] = scene;  // 改为使用title作为键
                }
            }
            
            console.log('所有场景加载完成:', Object.keys(this.scenes));
        } catch (error) {
            console.error('加载场景时出错:', error);
            this.showError('游戏场景加载失败，请刷新页面重试。');
        }
    }

    displayScene(sceneTitle) {
        const scene = this.scenes[sceneTitle];
        if (!scene) {
            this.showError(`场景 ${sceneTitle} 不存在`);
            return;
        }

        // 更新场景描述
        const descriptionEl = document.getElementById('scene-description');
        descriptionEl.innerHTML = `
            <h2>${scene.title}</h2>
            <p>${scene.description}</p>
        `;

        // 更新选择按钮或添加点击继续
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';

        if (scene.choices) {
            // 如果有选择项，显示选择按钮
            scene.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = `choice-btn ${this.getLuckClass(choice.luckChange)}`;
                button.textContent = choice.text;
                button.onclick = () => this.makeChoice(choice);
                choicesContainer.appendChild(button);
            });
        } else if (scene.nextScene) {
            // 如果没有选择项但有nextScene，显示点击继续提示
            descriptionEl.innerHTML += `
                <p style="color: #666; font-style: italic; margin-top: 20px;">点击任意处继续...</p>
            `;
            
            // 添加点击事件
            const sceneContainer = document.querySelector('.scene-container');
            const handleClick = () => {
                sceneContainer.removeEventListener('click', handleClick);
                this.currentScene = scene.nextScene;
                this.displayScene(scene.nextScene);
            };
            
            sceneContainer.addEventListener('click', handleClick);
        }

        // 添加场景切换动画
        this.animateSceneChange();
    }

    makeChoice(choice) {
        // 更新幸运值
        this.luck += choice.luckChange;
        this.luck = Math.max(0, Math.min(100, this.luck)); // 限制在0-100之间
        
        // 显示幸运值变化
        this.showLuckChange(choice.luckChange);
        this.updateLuckDisplay();

        // 切换到下一个场景或显示结局
        setTimeout(() => {
            if (choice.nextScene === 'end') {
                this.displayEnding(choice.endingText);
            } else {
                this.currentScene = choice.nextScene;
                this.displayScene(choice.nextScene);  // nextScene现在是title
            }
        }, 800);
    }
    
    displayEnding(endingText) {
        const descriptionEl = document.getElementById('scene-description');
        descriptionEl.innerHTML = `
            <h2>故事结局</h2>
            <p>${endingText}</p>
            <button class="choice-btn" onclick="location.reload()">重新开始游戏</button>
        `;
        
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';
    }

    getLuckClass(luckChange) {
        // 始终返回中性类，隐藏颜色提示
        return 'luck-neutral';
    }

    updateLuckDisplay() {
        const luckValueEl = document.getElementById('luck-value');
        luckValueEl.textContent = this.luck;
        
        // 根据幸运值改变颜色
        if (this.luck >= 70) {
            luckValueEl.style.color = '#28a745';
        } else if (this.luck >= 40) {
            luckValueEl.style.color = '#ffc107';
        } else {
            luckValueEl.style.color = '#dc3545';
        }
    }

    showLuckChange(change) {
        // 不再显示幸运值变化的具体数值和颜色
    }

    animateSceneChange() {
        const sceneContainer = document.querySelector('.scene-container');
        sceneContainer.style.opacity = '0';
        sceneContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            sceneContainer.style.transition = 'all 0.5s ease';
            sceneContainer.style.opacity = '1';
            sceneContainer.style.transform = 'translateY(0)';
        }, 50);
    }

    showError(message) {
        const descriptionEl = document.getElementById('scene-description');
        descriptionEl.innerHTML = `
            <h2>错误</h2>
            <p style="color: #dc3545;">${message}</p>
            <button class="choice-btn" onclick="location.reload()">重新加载游戏</button>
        `;
        
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    
    .luck-change {
        animation: fadeOut 1s ease-out forwards;
    }
    
    .scene-container {
        transition: all 0.5s ease;
    }
`;
document.head.appendChild(style);

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RedMansionGame();
});