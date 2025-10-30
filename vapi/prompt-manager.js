/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');

const PROMPTS_DIR = 'prompts';

// Paths for extracted prompts
const PATHS = {
    systemPrompt: path.join(PROMPTS_DIR, 'system-prompt.md'),
    firstMessage: path.join(PROMPTS_DIR, 'first-message.txt'),
    endCallMessage: path.join(PROMPTS_DIR, 'end-call-message.txt'),
    summaryPrompt: path.join(PROMPTS_DIR, 'summary-prompt.md'),
    successEvaluation: path.join(PROMPTS_DIR, 'success-evaluation.md'),
    structuredDataPrompt: path.join(PROMPTS_DIR, 'structured-data-prompt.md'),
    structuredDataSchema: path.join(PROMPTS_DIR, 'structured-data-schema.json')
};

// Helper function to generate output filename
function getExtractedConfigPath(inputPath) {
    const parsedPath = path.parse(inputPath);
    const baseName = path.basename(parsedPath.name); // Get filename without path and extension
    return path.join(parsedPath.dir, `${baseName}.extracted.json`);
}

async function extractPrompts(configPath) {
    try {
        // Read and parse the config file
        const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));

        // Create prompts directory if it doesn't exist
        await fs.mkdir(PROMPTS_DIR, { recursive: true });

        // Extract system prompt
        const systemPrompt = configData.model.messages.find(msg => msg.role === 'system')?.content;
        if (systemPrompt) {
            await fs.writeFile(PATHS.systemPrompt, systemPrompt);
        }

        // Extract first message
        if (configData.firstMessage) {
            await fs.writeFile(PATHS.firstMessage, configData.firstMessage);
        }

        // Extract end call message
        if (configData.endCallMessage) {
            await fs.writeFile(PATHS.endCallMessage, configData.endCallMessage);
        }

        // Extract analysis prompts
        if (configData.analysisPlan) {
            if (configData.analysisPlan.summaryPrompt) {
                await fs.writeFile(PATHS.summaryPrompt, configData.analysisPlan.summaryPrompt);
            }
            if (configData.analysisPlan.successEvaluationPrompt) {
                await fs.writeFile(PATHS.successEvaluation, configData.analysisPlan.successEvaluationPrompt);
            }
            if (configData.analysisPlan.structuredDataPrompt) {
                await fs.writeFile(PATHS.structuredDataPrompt, configData.analysisPlan.structuredDataPrompt);
            }
            if (configData.analysisPlan.structuredDataSchema) {
                await fs.writeFile(PATHS.structuredDataSchema, JSON.stringify(configData.analysisPlan.structuredDataSchema, null, 2));
            }
        }

        // Update config with file references
        const updatedConfig = {
            ...configData,
            model: {
                ...configData.model,
                messages: configData.model.messages.map(msg => 
                    msg.role === 'system' 
                        ? { ...msg, content: `@[${PATHS.systemPrompt}]` }
                        : msg
                )
            },
            firstMessage: `@[${PATHS.firstMessage}]`,
            endCallMessage: `@[${PATHS.endCallMessage}]`,
            serverUrl: configData.serverUrl,
            analysisPlan: {
                summaryPrompt: `@[${PATHS.summaryPrompt}]`,
                successEvaluationPrompt: `@[${PATHS.successEvaluation}]`,
                structuredDataPrompt: `@[${PATHS.structuredDataPrompt}]`,
                structuredDataSchema: `@[${PATHS.structuredDataSchema}]`
            }
        };

        // Get the extracted file path
        const { dir, name, ext } = path.parse(configPath);
        const extractedPath = path.join(dir, `${name}.extracted${ext}`);

        // Save the updated config
        await fs.writeFile(extractedPath, JSON.stringify(updatedConfig, null, 2));

        return extractedPath;
    } catch (error) {
        console.error('Error extracting prompts:', error);
        return null;
    }
}

async function reconstructConfig(extractedConfigPath) {
    try {
        // Read the extracted config
        const configData = JSON.parse(await fs.readFile(extractedConfigPath, 'utf8'));

        // Helper function to read file content
        const readFileContent = async (filePath) => {
            const cleanPath = filePath.replace(/^@\[(.+)\]$/, '$1');
            return await fs.readFile(cleanPath, 'utf8');
        };

        // Reconstruct the config
        const reconstructedConfig = {
            ...configData,
            model: {
                ...configData.model,
                messages: await Promise.all(configData.model.messages.map(async msg => {
                    if (msg.role === 'system') {
                        return {
                            ...msg,
                            content: await readFileContent(msg.content)
                        };
                    }
                    return msg;
                }))
            },
            firstMessage: await readFileContent(configData.firstMessage),
            endCallMessage: await readFileContent(configData.endCallMessage),
            serverUrl: configData.serverUrl,
            analysisPlan: {
                summaryPrompt: await readFileContent(configData.analysisPlan.summaryPrompt),
                successEvaluationPrompt: await readFileContent(configData.analysisPlan.successEvaluationPrompt),
                structuredDataPrompt: await readFileContent(configData.analysisPlan.structuredDataPrompt),
                structuredDataSchema: JSON.parse(await readFileContent(configData.analysisPlan.structuredDataSchema))
            }
        };

        // Get the original file path by removing '.extracted' from the name
        const { dir, name, ext } = path.parse(extractedConfigPath);
        const originalPath = path.join(dir, `${name.replace('.extracted', '')}${ext}`);

        // Save the reconstructed config back to the original file
        await fs.writeFile(originalPath, JSON.stringify(reconstructedConfig, null, 2));

        return originalPath;
    } catch (error) {
        console.error('Error reconstructing config:', error);
        return null;
    }
}

// Export functions for use in other files
module.exports = {
    extractPrompts,
    reconstructConfig,
    PATHS,
    getExtractedConfigPath
};
