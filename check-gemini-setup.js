#!/usr/bin/env node

/**
 * Gemini API Setup Checker
 * This script verifies that your Gemini API key is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Gemini API Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
    console.error('❌ .env file not found!');
    console.log('\n📝 To fix this:');
    console.log('1. Copy .env.example to .env:');
    console.log('   cp .env.example .env');
    console.log('\n2. Edit .env and add your Gemini API key (use ONE of these):');
    console.log('   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here  (recommended)');
    console.log('   OR');
    console.log('   GEMINI_API_KEY=your_actual_api_key_here');
    console.log('\n3. Get your API key from: https://makersuite.google.com/app/apikey');
    console.log('\n4. Restart the development server');
    process.exit(1);
}

console.log('✅ .env file exists');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let hasReactAppKey = false;
let hasGeminiKey = false;
let keyValue = null;
let keySource = null;

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('REACT_APP_GEMINI_API_KEY=')) {
        hasReactAppKey = true;
        keyValue = line.split('=')[1]?.trim();
        keySource = 'REACT_APP_GEMINI_API_KEY';
    } else if (trimmed.startsWith('GEMINI_API_KEY=') && !trimmed.startsWith('REACT_APP_')) {
        hasGeminiKey = true;
        if (!keyValue) { // Only use if REACT_APP_ version not found
            keyValue = line.split('=')[1]?.trim();
            keySource = 'GEMINI_API_KEY';
        }
    }
}

if (!hasReactAppKey && !hasGeminiKey) {
    console.error('❌ No Gemini API key found in .env file!');
    console.log('\n📝 To fix this:');
    console.log('1. Add ONE of these lines to your .env file:');
    console.log('   REACT_APP_GEMINI_API_KEY=your_actual_key  (recommended for Create React App)');
    console.log('   OR');
    console.log('   GEMINI_API_KEY=your_actual_key');
    console.log('\n2. Get your API key from: https://makersuite.google.com/app/apikey');
    console.log('\n3. Restart the development server');
    process.exit(1);
}

console.log(`✅ API key found: ${keySource}`);

if (!keyValue || keyValue === 'your_api_key_here' || keyValue === 'your_actual_api_key_here') {
    console.error(`❌ ${keySource} is set to a placeholder value!`);
    console.log('\n📝 To fix this:');
    console.log('1. Get your API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Replace the placeholder in .env with your actual key');
    console.log('3. Restart the development server');
    process.exit(1);
}

if (keyValue.length < 20) {
    console.warn('⚠️  API key seems too short. Make sure you copied the full key.');
}

console.log(`✅ ${keySource} appears to be set correctly`);
console.log(`   Key length: ${keyValue.length} characters`);
console.log(`   Key preview: ${keyValue.substring(0, 10)}...${keyValue.substring(keyValue.length - 4)}`);

if (hasGeminiKey && !hasReactAppKey) {
    console.warn('\n⚠️  WARNING: You are using GEMINI_API_KEY');
    console.warn('   This will NOT work with standard Create React App!');
    console.warn('   Create React App only exposes variables starting with REACT_APP_');
    console.warn('   Recommended: Change to REACT_APP_GEMINI_API_KEY in your .env file');
}

console.log('\n✨ Configuration looks good!');
console.log('\n⚠️  Important: If you just added/changed the key, you MUST restart the dev server:');
console.log('   1. Stop ALL running servers (Ctrl+C in each terminal)');
console.log('   2. Run: npm start');
console.log('\n');
