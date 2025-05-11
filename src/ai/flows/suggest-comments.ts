// use server'

/**
 * @fileOverview Provides comment suggestions based on community feedback for a given route.
 *
 * - suggestComments - A function that suggests comments for a given route.
 * - SuggestCommentsInput - The input type for the suggestComments function.
 * - SuggestCommentsOutput - The output type for the suggestComments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCommentsInputSchema = z.object({
  routeDescription: z
    .string()
    .describe('A description of the route the user has visited.'),
  communityFeedback: z
    .string()
    .describe('Aggregated community feedback for the route.'),
});
export type SuggestCommentsInput = z.infer<typeof SuggestCommentsInputSchema>;

const SuggestCommentsOutputSchema = z.object({
  suggestedComments: z
    .array(z.string())
    .describe('An array of suggested comments for the route.'),
});
export type SuggestCommentsOutput = z.infer<typeof SuggestCommentsOutputSchema>;

export async function suggestComments(input: SuggestCommentsInput): Promise<SuggestCommentsOutput> {
  return suggestCommentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCommentsPrompt',
  input: {schema: SuggestCommentsInputSchema},
  output: {schema: SuggestCommentsOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant comments for users who have visited a particular route.
  Based on the route description and community feedback, provide a list of suggested comments that the user can choose from.

  Route Description: {{{routeDescription}}}
  Community Feedback: {{{communityFeedback}}}

  Suggested Comments:`,
});

const suggestCommentsFlow = ai.defineFlow(
  {
    name: 'suggestCommentsFlow',
    inputSchema: SuggestCommentsInputSchema,
    outputSchema: SuggestCommentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
