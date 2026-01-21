/**
 * Landing Page Generator
 * Generates index.html from routes.config.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { routes, type Route } from '../routes.config';

export function generateLandingPage(): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JordGlobe - Project Home</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            width: 100%;
            padding: 40px;
        }

        h1 {
            color: #667eea;
            font-size: 3rem;
            margin-bottom: 10px;
            text-align: center;
        }

        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 40px;
            font-size: 1.1rem;
        }

        .section {
            margin-bottom: 40px;
        }

        .section h2 {
            color: #333;
            font-size: 1.5rem;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }

        .links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 15px;
        }

        .link-card {
            display: block;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            text-decoration: none;
            color: #333;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .link-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border-color: #667eea;
        }

        .link-card.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .link-card.primary:hover {
            border-color: white;
        }

        .link-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .link-description {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 0.9rem;
        }

        @media (max-width: 600px) {
            h1 {
                font-size: 2rem;
            }

            .container {
                padding: 25px;
            }

            .links-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌍 JordGlobe</h1>
        <p class="subtitle">Interactive Earth Globe with Babylon.js</p>

        <div class="section">
            <h2>Main Applications</h2>
            <div class="links-grid">
${routes.main.map(route => generateRouteCard(route, true)).join('\n')}
            </div>
        </div>

        <div class="section">
            <h2>Development & Testing</h2>
            <div class="links-grid">
${routes.dev.map(route => generateRouteCard(route, false)).join('\n')}
            </div>
        </div>

        <div class="footer">
            Built with Babylon.js | Development Server
        </div>
    </div>
</body>
</html>
`;

  return html;
}

function generateRouteCard(route: Route, isPrimary: boolean): string {
  const classes = isPrimary ? 'link-card primary' : 'link-card';
  return `                <a href="${route.path}" class="${classes}">
                    <div class="link-title">${route.title}</div>
                    <div class="link-description">${route.description}</div>
                </a>`;
}

// When run directly, generate and write the file
// Using import.meta.url for ESM compatibility
if (import.meta.url === `file://${process.argv[1]}`) {
  const html = generateLandingPage();
  const indexPath = join(process.cwd(), 'index.html');
  writeFileSync(indexPath, html, 'utf-8');
  console.log('✓ Generated index.html');
}
