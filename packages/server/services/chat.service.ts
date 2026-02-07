import fs from 'fs';
import path from 'path';
import template from '../prompts/chatbot.txt';
import { conversationRepository } from '../repositories/conversation.repository';
import { llmClient } from '../llm/client';

const parkInfo = fs.readFileSync(
   path.join(__dirname, '..', 'prompts', 'WonderWorld.md'),
   'utf-8'
);
const instructions = template.replace('{{parkInfo}}', parkInfo);

export const chatService = {
   async sendMessage(prompt: string, conversationId: string) {
      const response = await llmClient.generateText({
         model: 'gpt-4.1-nano-2025-04-14',
         instructions,
         prompt,
         temperature: 0.2,
         maxTokens: 200,
         previousResponseId:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);

      return {
         id: response.id,
         message: response.text,
      };
   },
};
