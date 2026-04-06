Netlify Deployment Instructions

This project is a static frontend (in the `Vibe` folder) with an optional Node proxy (`server.js`) for AI/search APIs. Netlify can host the static frontend; the server must run separately (or be deployed to a server/Cloud Run) if you need server endpoints.

Options to deploy:

1) Quick Drag & Drop (no Git required)
- Zip the contents of the `Vibe` folder (or open the `Vibe` folder in Finder/Explorer).
- Sign in to Netlify and go to "Sites" → "Add new site" → "Deploy manually" → drag & drop the folder contents.
- Netlify will publish the site and provide a URL. Note: Netlify sites are served via CDN and do not have a single static IP address.

2) Connect a Git repo
- Push the `Vibe` folder to a GitHub repository (root of repository should be the `Vibe` folder or set `publish` folder accordingly).
- In Netlify, "New site from Git" → authorize GitHub → select repo → set "Build command" blank and "Publish directory" to `.` (or `Vibe` if repo root contains multiple folders).
- Deploy site.

Environment variables (for server-side API calls):
- Netlify does not safely host your Node server; its functions can be used but for this project it's recommended to run the `server.js` separately on a server (Heroku / Render / VPS) or implement Netlify Functions.
- If your server is hosted elsewhere, add the keys to that server instead.

IP Address note
- Netlify uses a CDN and load balancers and does not provide a dedicated static IP for your site. If you require a fixed IP address for incoming connections, host your server on a VPS or cloud VM (AWS EC2, DigitalOcean Droplet, etc.).

Setting environment variables (if you deploy a server elsewhere):
- In the hosting provider for `server.js`, add `GOOGLE_API_KEY`, `GOOGLE_CX`, and `OPENAI_API_KEY` as environment variables.

Local testing
- Start the Node proxy locally (for /ai or /search endpoints):
  ```powershell
  cd "c:\Users\Aditi\Desktop\Vibe and study\Vibe"
  npm install
  $env:GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"
  $env:GOOGLE_CX = "YOUR_GOOGLE_CX"
  $env:OPENAI_API_KEY = "YOUR_OPENAI_KEY"
  npm start
  ```
- Serve the static site locally:
  ```powershell
  npx http-server . -p 8080
  # open http://localhost:8080/pages/chat.html
  ```

Support
- If you want me to deploy the Node server to a cloud provider (Render/Heroku) and connect it to Netlify frontend, I can prepare the necessary config files and instructions.
