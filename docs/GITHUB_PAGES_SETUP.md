# GitHub Pages Deployment Guide

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

## Prerequisites

- A GitHub repository
- GitHub Pages enabled for your repository
- Node.js 20 or higher

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment", select:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` (this branch will be created by GitHub Actions)
   - **Folder**: `/ (root)`
4. Click **Save**

### 2. Configure Repository Settings

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds the Angular application
- Deploys to the `gh-pages` branch
- Makes the site available at `https://YOUR_USERNAME.github.io/REPO_NAME`

### 3. Push to Repository

Simply push your changes to the `main` branch:

```bash
git push origin main
```

GitHub Actions will automatically build and deploy your site.

### 4. Monitor Deployment

1. Go to your repository
2. Click the **Actions** tab
3. Look for the "Deploy to GitHub Pages" workflow
4. Once the deployment is complete (green checkmark), your site will be live

## Project Structure

```
project/
├── src/
│   ├── .nojekyll              # Tells GitHub Pages to use our build output
│   ├── index.html
│   ├── main.ts
│   ├── global_styles.css
│   └── ...
├── dist/                       # Build output directory
│   └── demo/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
└── angular.json
```

## Build Output

The Angular application builds to `dist/demo/` which is automatically deployed by GitHub Actions.

## Troubleshooting

### Site not appearing

- Check that GitHub Pages is enabled in repository settings
- Verify the workflow ran successfully in the Actions tab
- Check that the `gh-pages` branch was created

### 404 errors on page refresh

This is normal for Single Page Applications (SPAs) on GitHub Pages. To fix:
1. The project should handle this automatically
2. If issues persist, ensure `.nojekyll` is in the dist folder (it should be copied automatically)

### Workflow failing

1. Check the Actions tab for error details
2. Ensure all dependencies are properly specified in `package.json`
3. Verify Node.js version compatibility

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to your repository root with your domain name
2. Configure DNS records pointing to GitHub Pages (see GitHub docs for details)
3. Verify domain in repository settings

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Angular Building for Production](https://angular.io/guide/build)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
