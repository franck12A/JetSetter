const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git')) return;
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const translations = [
    { from: />Profile</g, to: '>Perfil<' },
    { from: />Logout</g, to: '>Cerrar sesión<' },
    { from: />New Entry</g, to: '>Nueva entrada<' },
    { from: />Flight Details</g, to: '>Detalles del vuelo<' },
    { from: />Submit</g, to: '>Confirmar<' },
    { from: />Back</g, to: '>Volver<' },
    { from: /'Profile'/g, to: "'Perfil'" },
    { from: /'Logout'/g, to: "'Cerrar sesión'" },
    { from: /'New Entry'/g, to: "'Nueva entrada'" },
    { from: /'Flight Details'/g, to: "'Detalles del vuelo'" },
    { from: /'Submit'/g, to: "'Confirmar'" },
    { from: /'Back'/g, to: "'Volver'" },
    { from: /"Profile"/g, to: '"Perfil"' },
    { from: /"Logout"/g, to: '"Cerrar sesión"' },
    { from: /"New Entry"/g, to: '"Nueva entrada"' },
    { from: /"Flight Details"/g, to: '"Detalles del vuelo"' },
    { from: /"Submit"/g, to: '"Confirmar"' },
    { from: /"Back"/g, to: '"Volver"' }
];

walkDir('C:/Users/Franc/Desktop/JettSeter/reservas-frontend/src', function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
        let originalContent = fs.readFileSync(filePath, 'utf8');
        let content = originalContent;

        // 1. Fix Unicode Escapes like \u00f3
        // This regex catches \uXXXX sequences
        content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        // 2. Translations
        translations.forEach(t => {
            content = content.replace(t.from, t.to);
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed: ' + filePath);
        }
    }
});
