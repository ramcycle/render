const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Allows your frontend website to talk to Render without CORS errors
app.use(cors());

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Bro, you forgot to include ?url= in the request.');
  }

  try {
    // Fake a normal browser User-Agent so sites don't instantly block Render
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const contentType = response.headers.get('content-type') || '';

    // If it's an HTML webpage, inject a <base> tag so images, CSS, and scripts still load
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseTag = `<base href="${targetUrl}">`;
      
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else {
        html = baseTag + html;
      }

      res.set('Content-Type', 'text/html');
      return res.send(html);
    }

    // If it's an image, JSON, or CSS file, just pass the raw data straight through
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', contentType);
    res.send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).send(`Failed to fetch that site: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
