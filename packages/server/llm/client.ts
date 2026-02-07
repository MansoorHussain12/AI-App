import OpenAI from 'openai';

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

type GenerateTextOptions = {
   model?: string;
   prompt: string;
   temperature?: number;
   maxTokens?: number;
   instructions?: string;
   previousResponseId?: string;
};

type GenerateTextResult = {
   id: string;
   text: string;
};

export const llmClient = {
   async generateText({
      model = 'gpt-4.1-nano-2025-04-14',
      prompt,
      temperature = 0.2,
      maxTokens = 300,
      instructions,
      previousResponseId,
   }: GenerateTextOptions): Promise<GenerateTextResult> {
      const response = await client.responses.create({
         model,
         input: prompt,
         temperature,
         instructions,
         previous_response_id: previousResponseId,
         max_output_tokens: maxTokens,
      });

      return {
         id: response.id,
         text: response.output_text,
      };
   },
};
