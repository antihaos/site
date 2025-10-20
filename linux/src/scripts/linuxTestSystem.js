// Система тестирования Linux
class LinuxTestSystem {
    constructor() {
        this.tests = [];
        this.testElements = {};
        this.currentTestIndex = 0;
        this.score = 0;
        this.totalTests = 0;
    }
    
    // Загрузка тестов из JSON
    async loadTests() {
        try {
            const response = await fetch('src/data/linuxTests.json');
            if (!response.ok) {
                throw new Error(`Failed to load tests: ${response.status}`);
            }
            const data = await response.json();
            this.tests = data.tests;
            this.totalTests = this.tests.length;
            console.log('Tests loaded:', this.tests);
        } catch (error) {
            console.error('Error loading tests:', error);
        }
    }
    
    // Инициализация системы тестирования
    async init() {
        await this.loadTests();
        this.renderTests();
    }
    
    // Создание HTML для вариантов ответа
    createOptionsHtml(options) {
        let html = '<div class="space-y-2">';
        options.forEach((option, index) => {
            html += `
                <div class="flex items-center">
                    <input type="radio" name="test-option" value="${index}" class="mr-2" id="option-${index}">
                    <label for="option-${index}" class="text-sm">${option}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    // Отображение тестов на странице
    renderTests() {
        const container = document.getElementById('linux-tests-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.tests.forEach((test, index) => {
            const testWidget = document.createElement('div');
            testWidget.className = 'linux-test-widget glass rounded-2xl p-4 mb-4';
            testWidget.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold test-title">${test.title}</h3>
                    <span class="test-status text-blue-400 text-sm" id="status-${test.id}">Ожидание</span>
                </div>
                <p class="text-gray-300 text-sm mb-3 test-description">${test.description}</p>
                <div class="test-options space-y-2 mb-3" id="options-${test.id}">
                    ${this.createOptionsHtml(test.options)}
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div class="test-progress bg-blue-500 h-2 rounded-full" id="progress-${test.id}" style="width: 0%"></div>
                </div>
                <div class="test-feedback text-sm mb-3 hidden" id="feedback-${test.id}"></div>
                <button class="test-action-btn text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-full" id="action-${test.id}" data-test-id="${test.id}">
                    <i class="fas fa-play mr-1"></i>Начать тест
                </button>
            `;
            
            container.appendChild(testWidget);
            
            // Сохраняем ссылку на элементы теста
            this.testElements[test.id] = {
                widget: testWidget,
                status: document.getElementById(`status-${test.id}`),
                progress: document.getElementById(`progress-${test.id}`),
                options: document.getElementById(`options-${test.id}`),
                feedback: document.getElementById(`feedback-${test.id}`),
                actionBtn: document.getElementById(`action-${test.id}`)
            };
            
            // Добавляем обработчик события для кнопки
            this.testElements[test.id].actionBtn.addEventListener('click', () => {
                this.startTest(test.id);
            });
        });
        
        // Добавляем обработчики для радио кнопок
        document.querySelectorAll('input[name="test-option"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const testId = e.target.closest('.linux-test-widget').querySelector('.test-action-btn').dataset.testId;
                this.selectAnswer(testId, parseInt(e.target.value));
            });
        });
    }
    
    // Начало теста
    startTest(testId) {
        const testElement = this.testElements[testId];
        if (!testElement) return;
        
        // Обновляем статус
        testElement.status.textContent = 'В процессе';
        testElement.status.className = 'test-status text-yellow-400 text-sm';
        testElement.actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Проверка...';
        testElement.actionBtn.disabled = true;
        
        // Симуляция выполнения теста
        this.simulateTestExecution(testId);
    }
    
    // Выбор ответа
    selectAnswer(testId, optionIndex) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;
        
        const testElement = this.testElements[testId];
        if (!testElement) return;
        
        // Показываем кнопку проверки
        testElement.actionBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Проверить ответ';
        testElement.actionBtn.disabled = false;
        testElement.actionBtn.onclick = () => this.checkAnswer(testId, optionIndex);
    }
    
    // Проверка ответа
    checkAnswer(testId, selectedOption) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;
        
        const testElement = this.testElements[testId];
        if (!testElement) return;
        
        // Проверяем правильность ответа
        const isCorrect = selectedOption === test.correctAnswer;
        
        // Обновляем статус
        testElement.status.textContent = isCorrect ? 'Пройден' : 'Ошибка';
        testElement.status.className = `test-status ${isCorrect ? 'text-green-400' : 'text-red-400'} text-sm`;
        
        // Показываем обратную связь
        testElement.feedback.textContent = isCorrect ? 
            'Правильный ответ!' : 
            `Неправильно. Правильный ответ: ${test.options[test.correctAnswer]}`;
        testElement.feedback.className = `test-feedback text-sm mb-3 ${isCorrect ? 'text-green-400' : 'text-red-400'}`;
        testElement.feedback.classList.remove('hidden');
        
        // Обновляем кнопку
        testElement.actionBtn.innerHTML = '<i class="fas fa-redo mr-1"></i>Повторить';
        testElement.actionBtn.onclick = () => this.restartTest(testId);
        testElement.actionBtn.disabled = false;
        
        // Обновляем прогресс
        testElement.progress.style.width = '100%';
        testElement.progress.className = `test-progress h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`;
        
        // Обновляем счет
        if (isCorrect) {
            this.score++;
        }
    }
    
    // Перезапуск теста
    restartTest(testId) {
        const testElement = this.testElements[testId];
        if (!testElement) return;
        
        // Сбрасываем состояние теста
        testElement.status.textContent = 'Ожидание';
        testElement.status.className = 'test-status text-blue-400 text-sm';
        testElement.progress.style.width = '0%';
        testElement.progress.className = 'test-progress bg-blue-500 h-2 rounded-full';
        testElement.feedback.classList.add('hidden');
        testElement.actionBtn.innerHTML = '<i class="fas fa-play mr-1"></i>Начать тест';
        testElement.actionBtn.onclick = () => this.startTest(testId);
        testElement.actionBtn.disabled = false;
        
        // Сбрасываем выбор опций
        const radioButtons = testElement.options.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.checked = false;
        });
    }
    
    // Симуляция выполнения теста
    simulateTestExecution(testId) {
        const testElement = this.testElements[testId];
        if (!testElement) return;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            testElement.progress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                // Активируем опции для выбора
                testElement.actionBtn.innerHTML = '<i class="fas fa-hand-pointer mr-1"></i>Выберите ответ';
                testElement.actionBtn.disabled = false;
            }
        }, 100);
    }
    
    // Запуск всех тестов
    runAllTests() {
        this.tests.forEach(test => {
            this.startTest(test.id);
        });
    }
}

export default LinuxTestSystem;