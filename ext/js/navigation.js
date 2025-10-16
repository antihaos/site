// Менеджер навигации
const NavigationManager = {
    // Переключение между секциями
    switchSection(sectionId) {
        const sections = document.querySelectorAll('section');
        const navButtons = document.querySelectorAll('.nav-btn');

        // Скрыть все секции
        sections.forEach(section => {
            section.classList.add('hidden-section');
            section.style.opacity = '0';
        });

        // Показать выбранную секцию
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.remove('hidden-section');
            setTimeout(() => {
                activeSection.style.opacity = '1';
            }, 10);
        }

        // Обновить активную кнопку в навигации
        navButtons.forEach(btn => {
            const btnSection = btn.getAttribute('data-section');
            if (btnSection === sectionId) {
                btn.classList.remove('text-white', 'text-opacity-70');
                btn.classList.add('text-ios-blue');
            } else {
                btn.classList.remove('text-ios-blue');
                btn.classList.add('text-white', 'text-opacity-70');
            }
        });
    },

    // Инициализация навигации
    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        // Обработчики для кнопок навигации
        navButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                this.switchSection(sectionId);
            }.bind(this));
        });
    },

    // Инициализация быстрого доступа
    initQuickAccess() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('[data-section]')) {
                const element = e.target.closest('[data-section]');
                const sectionId = element.getAttribute('data-section');
                if (sectionId && sectionId !== 'emergency') {
                    this.switchSection(sectionId);
                }
            }
        }.bind(this));
    }
};