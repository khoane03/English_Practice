# English Practice

A static English-learning app built with Angular 21, TypeScript, and Tailwind CSS 4. It has mixed and full tests, editable text and image question banks, and JSON export. No backend or database is used.

## Run locally

```bash
npm ci
npm start
```

Open `http://localhost:4200`. App edits are saved in this browser's local storage; export the updated JSON from either question bank to keep a portable copy.

## Question data

- `src/assets/data/questions.json` contains the initial 44 text questions.
- `src/assets/data/image-exercises.json` starts empty; each exercise must have a valid HTTPS Cloudinary image URL and at least one question with an answer. Image exercises can have any number of questions.
- Image exercise forms can upload images directly to Cloudinary using a cloud name and unsigned upload preset. For local builds, copy `.env.example` to `.env.local` and fill in both values. For GitHub Pages, set the repository Actions variables `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET`; the deploy workflow injects them at build time. These values are public in the generated website. Never add the Cloudinary API secret to this static app; restrict allowed formats and upload size in the unsigned preset. Without environment values, the image bank allows saving the settings in the current browser.
- Both banks export their current data as JSON. Replace the corresponding asset JSON with an export when you want to update the app's initial data for everyone.

Answers are compared locally after normalizing case, punctuation, and whitespace. Both primary and accepted answers are checked exactly after normalization; there is no AI grading.

Question and answer cards include browser-based English read-aloud and English-to-Vietnamese translation. Translation requests send the selected text to the public MyMemory translation service; do not use this feature with private or sensitive content. Speech uses the browser's built-in speech synthesis.

## Production build

```bash
npm run validate:data
npm run build
```

The static site is generated in `dist/english-practice/browser`.

## GitHub Pages

The `CI / CD` GitHub Actions workflow validates the JSON data and runs a production build for every pull request targeting `main`. Pull requests are never deployed. After changes are merged or pushed to `main`, the workflow builds the site and deploys it to GitHub Pages. You can also start a deployment manually from the Actions tab while on `main`.

In repository settings, enable Pages and select **GitHub Actions** as the build and deployment source. To require successful CI before merging, add a branch protection rule for `main` and require the `build` job to pass. Hash-based routes allow direct navigation and refreshes on GitHub Pages.
