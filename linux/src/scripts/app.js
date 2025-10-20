import { createCosmicDecor } from './cosmicDecor.js';
import TestSystem from './testSystem.js';
import LinuxTestSystem from './linuxTestSystem.js';

// Функция для загрузки HTML компонента
async function loadComponent(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${url}`);
        }
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

// Глобальная функция переключения страниц
window.switchPage = function(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.stacked-page').forEach(page => {
        page.classList.remove('active', 'previous');
    });
    
    // Показать выбранную страницу
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.classList.add('active');
    }
    
    // Обновить кнопки bottom bar
    document.querySelectorAll('#home-btn, #tests-btn, #settings-btn').forEach(btn => {
        btn.classList.remove('glass-selected');
    });
    
    const pageButton = document.getElementById(`${pageId}-btn`);
    if (pageButton) {
        pageButton.classList.add('glass-selected');
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем компоненты страниц
    await loadComponent('src/components/homePage.html', 'home-page-container');
    await loadComponent('src/components/testsPage.html', 'tests-page-container');
    await loadComponent('src/components/settingsPage.html', 'settings-page-container');
    
    // Загружаем заголовки для каждой страницы
    await loadComponent('src/components/homePageHeader.html', 'home-page-header-container');
    await loadComponent('src/components/testsPageHeader.html', 'tests-page-header-container');
    await loadComponent('src/components/settingsPageHeader.html', 'settings-page-header-container');
    
    // Загружаем нижнюю панель навигации
    await loadComponent('src/components/bottomBar.html', 'bottom-bar-container');
    
    // Создаем космический декор
    createCosmicDecor();
    
    // Инициализируем систему тестирования
    window.testSystem = new TestSystem();
    window.testSystem.init();
    
    // Инициализируем систему тестирования Linux
    window.linuxTestSystem = new LinuxTestSystem();
    await window.linuxTestSystem.init();
});