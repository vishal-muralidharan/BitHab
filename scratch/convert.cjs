const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('vanilla_backup/pages');
files.push('../index.html'); // Add index.html as a special case

function htmlToJsx(html) {
    let jsx = html.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    // Ensure self-closing tags are closed properly, but be careful with existing slashes
    jsx = jsx.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
    jsx = jsx.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
    jsx = jsx.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
    jsx = jsx.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');
    
    // SVG attributes
    jsx = jsx.replace(/fill-rule=/g, 'fillRule=');
    jsx = jsx.replace(/clip-rule=/g, 'clipRule=');
    jsx = jsx.replace(/stroke-width=/g, 'strokeWidth=');
    jsx = jsx.replace(/stroke-linecap=/g, 'strokeLinecap=');
    jsx = jsx.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
    jsx = jsx.replace(/stroke-dasharray=/g, 'strokeDasharray=');
    jsx = jsx.replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
    
    // Some inline style handling just in case
    jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
        // Very basic inline style conversion to React style object string
        // Only handles simple styles like "width: 50%" -> style={{width: '50%'}}
        const props = p1.split(';').filter(Boolean).map(s => {
            const [k,v] = s.split(':');
            if(!k || !v) return '';
            const key = k.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            return `${key}: '${v.trim().replace(/'/g, "\\'")}'`;
        }).filter(Boolean).join(', ');
        return `style={{${props}}}`;
    });
    
    // Remove comments to prevent issues
    jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
    
    return jsx;
}

files.forEach(file => {
    if (!file.endsWith('.html')) return;
    const filepath = path.join('vanilla_backup/pages', file);
    const content = fs.readFileSync(filepath, 'utf8');
    
    let inner = '';
    
    if (file === '../index.html') {
        const dashboardMatch = content.match(/<div class="main-layout[^>]*>([\s\S]*?)<\/div>\s*<\/main>/);
        inner = dashboardMatch ? `<div className="main-layout">${dashboardMatch[1]}</div>` : '';
    } else {
        const match = content.match(/<main class="content">([\s\S]*?)<\/main>/);
        inner = match ? match[1] : '';
    }
    
    inner = htmlToJsx(inner);
    
    let name = file === '../index.html' ? 'Dashboard' : file.replace('.html', '').split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
    
    const jsx = `import { Link } from 'react-router-dom';\n\nexport default function ${name}() {\n  return (\n    <>\n${inner}\n    </>\n  );\n}\n`;
    
    fs.writeFileSync(`src/pages/${name}.jsx`, jsx);
    console.log(`Created ${name}.jsx`);
});
