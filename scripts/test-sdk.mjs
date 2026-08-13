import { create } from 'z-ai-web-dev-sdk';

async function test() {
  try {
    console.log('Creating ZAI instance...');
    const zai = await create();
    console.log('ZAI created, type:', typeof zai.createChatCompletion);
    console.log('Keys:', Object.keys(zai).join(', '));
    const result = await zai.createChatCompletion({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: 'Say hello in 10 words' }],
      max_tokens: 100,
      temperature: 0.5,
    });
    console.log('Result:', JSON.stringify(result).substring(0, 500));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
