# Bright Future website — VS Code setup

This folder contains the same HTML, CSS, JavaScript, and images as the website layout created in this conversation. No npm install, framework, database, or build step is required.

## Open and preview

1. Extract the ZIP using Extract All on Windows.
2. In VS Code, choose File > Open Folder.
3. Select the bright-future-school folder that contains index.html, styles.css, app.js, and assets.
4. Right-click index.html in VS Code's Explorer and choose Open in Integrated Browser. On current versions, you can also open the file and use the Show Preview icon in the editor title bar.
5. Edit a file and save with Ctrl+S. Refresh the preview if it does not update automatically.

If Open in Integrated Browser is unavailable in your version, install Microsoft's Live Preview extension from Extensions (Ctrl+Shift+X). Search for ms-vscode.live-server, then open index.html and use the preview button at the top right of the editor.

For a simple browser preview, you can also double-click index.html in Windows File Explorer. Refresh the browser after saving changes.

## What to edit

| File | Purpose |
| --- | --- |
| index.html | Page sections, school name, contact details, navigation, and visible text |
| styles.css | Colours, fonts, spacing, layout, and responsive mobile rules |
| app.js | Mobile menu, program details, popup panels, and preview form behaviour |
| assets/hero-school.png | The large classroom photo at the top |
| assets/school-reference.jpg | Supplied reference image used for the campus, program, and admissions photos |

The first :root block in styles.css contains the brand colours:
- Navy: --navy: #071e3b
- Gold: --gold: #dfa824

To change the hero image, replace assets/hero-school.png with your own PNG using the same filename, or update the hero image paths in both styles.css and app.js.

The other photos are displayed from specific regions of school-reference.jpg, using --cx, --cy, --cw, and --ch in index.html. Keep that reference image for the exact layout. To use individual school photos, replace the corresponding reference-photo markup and its crop styles with normal image elements.

The source CSS is compact. In VS Code on Windows, press Shift+Alt+F to format the current file before editing.

## What is functional

- Responsive desktop and mobile layouts.
- Navigation links and mobile menu.
- Program detail, admissions, and tour information panels.
- Email links that open your email application.

## What needs connecting for a real school

School details and statistics are illustrative and should be replaced with verified information. Parent/student portals, application submission, tour booking, and newsletter subscription are placeholders. The newsletter form does not submit or store the entered email address. Email links currently use the address shown in the reference design.

The site uses Google Fonts when internet access is available and system-font fallbacks otherwise.

## Optional localhost server

If Python is already installed on Windows, open Terminal > New Terminal in this folder and run:

    py -m http.server 8000 --bind 127.0.0.1

Open http://localhost:8000 in your browser. Press Ctrl+C in the terminal to stop the server. If your Python command is python or python3, use that instead of py.

## Official VS Code instructions

- HTML preview: https://code.visualstudio.com/docs/languages/html#_preview-html-files-in-the-integrated-browser
- Microsoft Live Preview: https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server
