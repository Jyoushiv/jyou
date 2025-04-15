const express = require('express');
const { Client } = require('@notionhq/client');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 3000;

// Hardcoded Notion token as requested
const NOTION_TOKEN = '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';

// Initialize the Notion client
const notion = new Client({
  auth: NOTION_TOKEN,
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Copy Diem CSS files to public directory
const copyDiemCssFiles = () => {
  const diemCssDir = path.join(__dirname, '..', 'diem');
  const publicCssDir = path.join(__dirname, 'public', 'css');
  
  if (!fs.existsSync(publicCssDir)) {
    fs.mkdirSync(publicCssDir, { recursive: true });
  }
  
  // Copy CSS files
  fs.readdirSync(diemCssDir).forEach(file => {
    if (file.endsWith('.css')) {
      fs.copyFileSync(
        path.join(diemCssDir, file),
        path.join(publicCssDir, file)
      );
    }
  });
};

// Function to fetch pages from Notion
async function fetchNotionPages() {
  try {
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    return response.results;
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return [];
  }
}

// Function to fetch databases from Notion
async function fetchNotionDatabases() {
  try {
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    });
    
    return response.results;
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    return [];
  }
}

// Function to fetch page content
async function fetchPageContent(pageId) {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    return blocks.results;
  } catch (error) {
    console.error(`Error fetching content for page ${pageId}:`, error);
    return [];
  }
}

// Function to convert Notion blocks to HTML
function convertBlocksToHtml(blocks) {
  let html = '';
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'paragraph':
        if (block.paragraph.rich_text.length > 0) {
          html += `<p>${block.paragraph.rich_text.map(text => text.plain_text).join('')}</p>`;
        } else {
          html += '<p></p>';
        }
        break;
      case 'heading_1':
        html += `<h1>${block.heading_1.rich_text.map(text => text.plain_text).join('')}</h1>`;
        break;
      case 'heading_2':
        html += `<h2>${block.heading_2.rich_text.map(text => text.plain_text).join('')}</h2>`;
        break;
      case 'heading_3':
        html += `<h3>${block.heading_3.rich_text.map(text => text.plain_text).join('')}</h3>`;
        break;
      case 'bulleted_list_item':
        html += `<ul><li>${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}</li></ul>`;
        break;
      case 'numbered_list_item':
        html += `<ol><li>${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}</li></ol>`;
        break;
      case 'to_do':
        const checked = block.to_do.checked ? 'checked' : '';
        html += `<div class="todo-item"><input type="checkbox" ${checked} disabled><span>${block.to_do.rich_text.map(text => text.plain_text).join('')}</span></div>`;
        break;
      case 'toggle':
        html += `<details><summary>${block.toggle.rich_text.map(text => text.plain_text).join('')}</summary><div class="toggle-content"></div></details>`;
        break;
      case 'image':
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        html += `<figure><img src="${imageUrl}" alt="Image"><figcaption></figcaption></figure>`;
        break;
      default:
        // For unsupported block types
        html += `<div class="unsupported-block">${block.type} block</div>`;
    }
  });
  
  return html;
}

// Function to generate HTML page
function generateHtmlPage(title, content, cssFile = 'style.css') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/${cssFile}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--color-text-default, #333);
      background-color: var(--color-bg-default, #fff);
      max-width: var(--container-width, 1200px);
      margin: 0 auto;
      padding: 20px;
    }
    .notion-header {
      margin-bottom: 40px;
    }
    .notion-header__title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .todo-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .todo-item input {
      margin-right: 8px;
    }
    .unsupported-block {
      padding: 10px;
      background-color: #f1f1f1;
      border-radius: 4px;
      margin-bottom: 10px;
      color: #666;
    }
    .super-navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--color-border-default, #eaeaea);
    }
    .super-navbar__item-list {
      display: flex;
      gap: 24px;
    }
    .super-navbar__item {
      text-decoration: none;
      color: var(--navbar-button-text-color, #333);
    }
  </style>
</head>
<body>
  <div class="super-navbar">
    <div class="super-navbar__logo">
      <a href="/">My Notion Website</a>
    </div>
    <div class="super-navbar__item-list">
      <a href="/" class="super-navbar__item">Home</a>
      <a href="/about" class="super-navbar__item">About</a>
      <a href="/contact" class="super-navbar__item">Contact</a>
    </div>
  </div>

  <div class="notion-header">
    <h1 class="notion-header__title">${title}</h1>
  </div>

  <div class="notion-content">
    ${content}
  </div>
</body>
</html>
  `;
}

// Generate website from Notion content
async function generateWebsite() {
  try {
    // Ensure directories exist
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    // Copy Diem CSS files
    copyDiemCssFiles();
    
    // Fetch pages from Notion
    const pages = await fetchNotionPages();
    
    // Process each page
    for (const page of pages) {
      try {
        // Get page title
        let pageTitle = 'Untitled';
        if (page.properties && page.properties.title) {
          const titleProperty = page.properties.title;
          if (titleProperty.title && titleProperty.title.length > 0) {
            pageTitle = titleProperty.title[0].plain_text;
          }
        }
        
        // Get page content
        const blocks = await fetchPageContent(page.id);
        const htmlContent = convertBlocksToHtml(blocks);
        
        // Generate HTML file
        const slug = pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const htmlFilePath = path.join(publicDir, `${slug}.html`);
        
        // Write HTML file
        fs.writeFileSync(
          htmlFilePath,
          generateHtmlPage(pageTitle, htmlContent)
        );
        
        console.log(`Generated page: ${pageTitle} -> ${htmlFilePath}`);
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }
    
    // Create index.html if it doesn't exist
    const indexPath = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      // Create a simple index page
      fs.writeFileSync(
        indexPath,
        generateHtmlPage('Home', '<p>Welcome to your Notion-powered website!</p>')
      );
      console.log('Generated default index.html');
    }
    
    console.log('Website generation complete!');
  } catch (error) {
    console.error('Error generating website:', error);
  }
}

// Routes
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await fetchNotionPages();
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/databases', async (req, res) => {
  try {
    const databases = await fetchNotionDatabases();
    res.json(databases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/generate', async (req, res) => {
  try {
    await generateWebsite();
    res.json({ success: true, message: 'Website generated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Generate website: http://0.0.0.0:${PORT}/api/generate`);
  
  // Generate website on startup
  generateWebsite();
});
