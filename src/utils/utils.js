// Funciones auxiliares reutilizables

// Genera un código único de 4 caracteres para la sala
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Mezcla un array aleatoriamente (algoritmo Fisher-Yates)
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Retorna una categoría aleatoria de las disponibles
function getRandomCategory(categoryNames) {
    const categories = Object.keys(categoryNames);
    return categories[Math.floor(Math.random() * categories.length)];
}

// Retorna un palabra aleatoria de una categoría
function getRandomWord(words) {
    return words[Math.floor(Math.random() * words.length)];
}

module.exports = {
    generateRoomCode,
    shuffleArray,
    getRandomCategory,
    getRandomWord
};
