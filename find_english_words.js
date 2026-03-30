const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git')) return;
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const engWords = /\b(Name|First Name|Last Name|Email|Password|Confirm Password|Origin|Destination|Flight|Booking|Category|User|Admin|Role|Status|Active|Inactive|Delete|Edit|Save|Cancel|Dashboard|Settings|Price|Total|Search|Not found|Loading)\b/g;

walkDir('C:/Users/Franc/Desktop/JettSeter/reservas-frontend/src', function(filePath) {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let lines = content.split('\n');
        lines.forEach((l, i) => {
            if (l.match(engWords)) {
                if (!l.includes('import ') && !l.includes('className=') && !l.includes('const ') && !l.includes('let ') && !l.includes('var ')) {
                    if (/>[^<]+</.test(l) || /placeholder=\"/.test(l) || /<label/.test(l)) {
                        console.log(filePath + ':' + (i+1) + '  ' + l.trim());
                    }
                }
            }
        });
    }
});
