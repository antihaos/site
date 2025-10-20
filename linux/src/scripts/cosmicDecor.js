// Создание космического декора
export function createCosmicDecor() {
    const decorContainer = document.getElementById('cosmic-decor');
    
    // Создание звезд
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.opacity = Math.random() * 0.8 + 0.2;
        star.style.setProperty('--duration', `${Math.random() * 5 + 3}s`);
        decorContainer.appendChild(star);
    }
    
    // Создание туманностей
    for (let i = 0; i < 3; i++) {
        const nebula = document.createElement('div');
        nebula.classList.add('nebula');
        nebula.style.left = `${Math.random() * 100}%`;
        nebula.style.top = `${Math.random() * 100}%`;
        nebula.style.width = `${Math.random() * 300 + 100}px`;
        nebula.style.height = nebula.style.width;
        
        const colors = ['rgba(123, 31, 162, 0.3)', 'rgba(41, 121, 255, 0.3)', 'rgba(31, 162, 123, 0.3)'];
        nebula.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        decorContainer.appendChild(nebula);
    }
    
    // Создание планет
    for (let i = 0; i < 2; i++) {
        const planet = document.createElement('div');
        planet.classList.add('planet');
        planet.style.left = `${Math.random() * 100}%`;
        planet.style.top = `${Math.random() * 100}%`;
        planet.style.width = `${Math.random() * 100 + 50}px`;
        planet.style.height = planet.style.width;
        decorContainer.appendChild(planet);
    }
}