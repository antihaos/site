// Система тестирования
class TestSystem {
    constructor() {
        this.tests = {
            'engine': {
                name: 'Двигательная установка',
                statusElement: null,
                progressElement: null,
                buttonElement: null,
                status: 'passed',
                progress: 100
            },
            'navigation': {
                name: 'Система навигации',
                statusElement: null,
                progressElement: null,
                buttonElement: null,
                status: 'running',
                progress: 60
            },
            'life-support': {
                name: 'Система жизнеобеспечения',
                statusElement: null,
                progressElement: null,
                buttonElement: null,
                status: 'waiting',
                progress: 0
            },
            'communication': {
                name: 'Связь',
                statusElement: null,
                progressElement: null,
                buttonElement: null,
                status: 'passed',
                progress: 100
            }
        };
    }
    
    // Инициализация тестов
    init() {
        // Получаем элементы для каждого теста
        this.tests['engine'].statusElement = document.getElementById('engine-status');
        this.tests['engine'].progressElement = document.getElementById('engine-progress');
        this.tests['engine'].buttonElement = document.getElementById('engine-test-btn');
        
        this.tests['navigation'].statusElement = document.getElementById('navigation-status');
        this.tests['navigation'].progressElement = document.getElementById('navigation-progress');
        this.tests['navigation'].buttonElement = document.getElementById('navigation-test-btn');
        
        this.tests['life-support'].statusElement = document.getElementById('life-support-status');
        this.tests['life-support'].progressElement = document.getElementById('life-support-progress');
        this.tests['life-support'].buttonElement = document.getElementById('life-support-test-btn');
        
        this.tests['communication'].statusElement = document.getElementById('communication-status');
        this.tests['communication'].progressElement = document.getElementById('communication-progress');
        this.tests['communication'].buttonElement = document.getElementById('communication-test-btn');
        
        // Добавляем обработчики событий для кнопок тестов
        if (this.tests['engine'].buttonElement) {
            this.tests['engine'].buttonElement.addEventListener('click', () => {
                this.runTest('engine');
            });
        }
        
        if (this.tests['navigation'].buttonElement) {
            this.tests['navigation'].buttonElement.addEventListener('click', () => {
                this.runTest('navigation');
            });
        }
        
        if (this.tests['life-support'].buttonElement) {
            this.tests['life-support'].buttonElement.addEventListener('click', () => {
                this.runTest('life-support');
            });
        }
        
        if (this.tests['communication'].buttonElement) {
            this.tests['communication'].buttonElement.addEventListener('click', () => {
                this.runTest('communication');
            });
        }
        
        // Добавляем обработчик для кнопки запуска всех тестов
        const runAllButton = document.getElementById('run-all-tests-btn');
        if (runAllButton) {
            runAllButton.addEventListener('click', () => {
                this.runAllTests();
            });
        }
        
        // Обновляем отображение тестов
        this.updateDisplay();
    }
    
    // Обновление отображения тестов
    updateDisplay() {
        for (const testId in this.tests) {
            const test = this.tests[testId];
            
            // Обновляем статус
            if (test.statusElement) {
                test.statusElement.textContent = this.getStatusText(test.status);
                test.statusElement.className = `text-sm ${this.getStatusColor(test.status)}`;
            }
            
            // Обновляем прогресс
            if (test.progressElement) {
                test.progressElement.style.width = `${test.progress}%`;
                test.progressElement.className = `test-progress h-2 rounded-full ${this.getProgressColor(test.status)}`;
            }
            
            // Обновляем кнопку
            if (test.buttonElement) {
                if (test.status === 'running') {
                    test.buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Выполняется...';
                    test.buttonElement.disabled = true;
                } else if (test.status === 'passed' || test.status === 'failed') {
                    test.buttonElement.innerHTML = '<i class="fas fa-redo mr-1"></i>Повторить';
                    test.buttonElement.disabled = false;
                } else {
                    test.buttonElement.innerHTML = '<i class="fas fa-play mr-1"></i>Запустить';
                    test.buttonElement.disabled = false;
                }
            }
            
            // Добавляем/удаляем анимацию для запущенных тестов
            const testElement = document.getElementById(`${testId}-test`);
            if (testElement) {
                if (test.status === 'running') {
                    testElement.classList.add('test-running');
                } else {
                    testElement.classList.remove('test-running');
                }
            }
        }
    }
    
    // Получение текста статуса
    getStatusText(status) {
        switch (status) {
            case 'waiting': return 'Ожидание';
            case 'running': return 'В процессе';
            case 'passed': return 'Пройден';
            case 'failed': return 'Ошибка';
            default: return 'Неизвестно';
        }
    }
    
    // Получение цвета статуса
    getStatusColor(status) {
        switch (status) {
            case 'waiting': return 'text-blue-400';
            case 'running': return 'text-yellow-400';
            case 'passed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            default: return 'text-gray-400';
        }
    }
    
    // Получение цвета прогресса
    getProgressColor(status) {
        switch (status) {
            case 'waiting': return 'bg-blue-500';
            case 'running': return 'bg-yellow-500';
            case 'passed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }
    
    // Запуск теста
    runTest(testId) {
        const test = this.tests[testId];
        if (!test) return;
        
        // Устанавливаем статус "в процессе"
        test.status = 'running';
        test.progress = 0;
        this.updateDisplay();
        
        // Симуляция выполнения теста
        this.simulateTestExecution(testId);
    }
    
    // Симуляция выполнения теста
    simulateTestExecution(testId) {
        const test = this.tests[testId];
        if (!test) return;
        
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            test.progress = Math.min(progress, 100);
            this.updateDisplay();
            
            if (progress >= 100) {
                clearInterval(interval);
                // Случайный результат теста
                test.status = Math.random() > 0.2 ? 'passed' : 'failed';
                this.updateDisplay();
            }
        }, 200);
    }
    
    // Запуск всех тестов
    runAllTests() {
        const runAllButton = document.getElementById('run-all-tests-btn');
        if (!runAllButton) return;
        
        runAllButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Выполнение...';
        runAllButton.disabled = true;
        
        // Запускаем все тесты, которые не в процессе выполнения
        for (const testId in this.tests) {
            if (this.tests[testId].status !== 'running') {
                this.runTest(testId);
            }
        }
        
        // Проверяем завершение всех тестов
        const checkInterval = setInterval(() => {
            let allTestsCompleted = true;
            for (const testId in this.tests) {
                if (this.tests[testId].status === 'running') {
                    allTestsCompleted = false;
                    break;
                }
            }
            
            if (allTestsCompleted) {
                clearInterval(checkInterval);
                runAllButton.innerHTML = '<i class="fas fa-play-circle mr-2"></i>Запустить все тесты';
                runAllButton.disabled = false;
            }
        }, 500);
    }
}

export default TestSystem;