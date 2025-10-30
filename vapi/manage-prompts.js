#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { extractPrompts, reconstructConfig } = require('./prompt-manager');
const path = require('path');

const command = process.argv[2];
const configPath = process.argv[3];

if (!command || !configPath) {
    console.log('Usage:');
    console.log('  Extract prompts:    node manage-prompts.js extract <config-path>');
    console.log('  Reconstruct config: node manage-prompts.js reconstruct <extracted-config-path>');
    process.exit(1);
}

async function main() {
    const absolutePath = path.resolve(configPath);
    
    if (command === 'extract') {
        const extractedPath = await extractPrompts(absolutePath);
        if (extractedPath) {
            console.log('Successfully extracted prompts to ./prompts directory');
            console.log(`Created extracted config at ${path.relative(process.cwd(), extractedPath)}`);
        }
    } else if (command === 'reconstruct') {
        const originalPath = await reconstructConfig(absolutePath);
        if (originalPath) {
            console.log(`Successfully reconstructed config at ${path.relative(process.cwd(), originalPath)}`);
        }
    } else {
        console.log('Invalid command. Use "extract" or "reconstruct"');
    }
}

main().catch(console.error);
