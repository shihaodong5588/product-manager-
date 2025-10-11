const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyBQ0TZ7O-bAIb2GRIDHhmOZNHjfvbvm2cE';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log('Fetching available models...\n');

    // 尝试列出所有模型
    const models = await genAI.listModels();

    console.log('Available models:');
    console.log('='.repeat(50));

    for await (const model of models) {
      console.log(`\nModel: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(`Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);

    // 如果列出失败，尝试几个常见的模型名
    console.log('\nTrying common model names...\n');

    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro',
    ];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`✓ ${modelName} - WORKS`);
      } catch (e) {
        console.log(`✗ ${modelName} - ${e.message.split('\n')[0]}`);
      }
    }
  }
}

listModels();
