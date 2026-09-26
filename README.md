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
- `src/assets/data/image-exercises.json` starts empty; add only exercises with a valid HTTPS Cloudinary image URL and provided questions/answers.
- Both banks export their current data as JSON. Replace the corresponding asset JSON with an export when you want to update the app's initial data for everyone.

Answers are compared locally after normalizing case, punctuation, and whitespace. Both primary and accepted answers are checked exactly after normalization; there is no AI grading.

## Production build

```bash
npm run validate:data
npm run build
```

The static site is generated in `dist/english-practice/browser`.

## GitHub Pages

The `CI / CD` GitHub Actions workflow validates the JSON data and runs a production build for every pull request targeting `main`. Pull requests are never deployed. After changes are merged or pushed to `main`, the workflow builds the site and deploys it to GitHub Pages. You can also start a deployment manually from the Actions tab while on `main`.

In repository settings, enable Pages and select **GitHub Actions** as the build and deployment source. To require successful CI before merging, add a branch protection rule for `main` and require the `build` job to pass. Hash-based routes allow direct navigation and refreshes on GitHub Pages.
