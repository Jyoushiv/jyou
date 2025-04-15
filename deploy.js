#!/usr/bin/env node

/**
 * Script to deploy the website to GitHub Pages
 * This script should be run after generating the website
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Hardcoded configuration
const GITHUB_USERNAME = 'username'; // Replace with actual GitHub username
const GITHUB_REPO = 'username.github.io'; // Replace with actual GitHub repo name
const GITHUB_EMAIL = 'email@example.com'; // Replace with actual GitHub email
const GITHUB_NAME = 'Your Name'; // Replace with actual GitHub name

// Paths
const PUBLIC_DIR = path.join(__dirname, 'public');
const DEPLOY_DIR = path.join(__dirname, 'deploy');

// Ensure the deploy directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR);
}

try {
  // Clear the deploy directory
  console.log('Clearing deploy directory...');
  fs.readdirSync(DEPLOY_DIR).forEach(file => {
    const filePath = path.join(DEPLOY_DIR, file);
    if (file !== '.git' && file !== '.gitignore') {
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });

  // Copy files from public to deploy
  console.log('Copying files to deploy directory...');
  fs.readdirSync(PUBLIC_DIR).forEach(file => {
    const srcPath = path.join(PUBLIC_DIR, file);
    const destPath = path.join(DEPLOY_DIR, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  // Initialize git repo if it doesn't exist
  if (!fs.existsSync(path.join(DEPLOY_DIR, '.git'))) {
    console.log('Initializing git repository...');
    execSync('git init', { cwd: DEPLOY_DIR });
    execSync(`git remote add origin https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git`, { cwd: DEPLOY_DIR });
  }

  // Configure git
  console.log('Configuring git...');
  execSync(`git config user.email "${GITHUB_EMAIL}"`, { cwd: DEPLOY_DIR });
  execSync(`git config user.name "${GITHUB_NAME}"`, { cwd: DEPLOY_DIR });

  // Add .nojekyll file to disable Jekyll processing
  fs.writeFileSync(path.join(DEPLOY_DIR, '.nojekyll'), '');

  // Commit and push changes
  console.log('Committing changes...');
  execSync('git add .', { cwd: DEPLOY_DIR });
  execSync('git commit -m "Update website from Notion"', { cwd: DEPLOY_DIR });
  
  console.log('Pushing to GitHub...');
  execSync('git push -u origin main', { cwd: DEPLOY_DIR });

  console.log('Deployment successful!');
  console.log(`Your website is now available at https://${GITHUB_USERNAME}.github.io/`);
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
