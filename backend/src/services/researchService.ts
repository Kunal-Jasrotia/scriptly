import axios from 'axios';
import { load } from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const getModel = () =>
  new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

async function scrapeUrl(url: string): Promise<string> {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ScriptStudioBot/1.0)',
    },
  });

  const $ = load(response.data as string);

  // Remove noisy elements
  $('script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar').remove();

  // Prefer article/main content over full body
  const contentSelector =
    'article, main, [role="main"], .content, .post-content, .entry-content, body';
  const bodyText = $(contentSelector).first().text().replace(/\s+/g, ' ').trim().slice(0, 8000); // Cap per URL to avoid token overflow

  return bodyText;
}

export async function researchUrls(urls: string[]): Promise<string> {
  if (!urls || urls.length === 0) return '';

  const scrapedTexts: string[] = [];

  for (const url of urls) {
    try {
      const text = await scrapeUrl(url);
      if (text.length > 100) {
        scrapedTexts.push(`SOURCE: ${url}\n${text}`);
      }
    } catch (err) {
      // Non-fatal — log and continue with remaining URLs
      console.warn(`[Research] Failed to scrape ${url}:`, (err as Error).message);
    }
  }

  if (scrapedTexts.length === 0) return '';

  const combinedText = scrapedTexts.join('\n\n---\n\n').slice(0, 20000);

  const model = getModel();
  const response = await model.invoke([
    new SystemMessage(
      'You are a research analyst. Summarize the provided source material into a concise, factual summary. ' +
        'Focus on key facts, statistics, and insights that would be valuable for creating engaging short-form video content. ' +
        'Do NOT hallucinate or add information not present in the sources. Maximum 300 words.'
    ),
    new HumanMessage(`Summarize these sources for a short-form video script:\n\n${combinedText}`),
  ]);

  return response.content as string;
}
