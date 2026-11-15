# Daniel Franco portfolio

A static portfolio with an AI chatbot, built for Cloudflare Pages. It has no build step.

## What to edit

Everything on the page, and everything the chatbot knows, comes from `public/content.json`.

1. Replace the sample text with your own.
2. Put screenshots in `public/images/` and set a project's `image` to `images/your-file.png`.
3. The PDC60 section comes from `course` in the same file: one entry per module with its learnings, activities, old vs new prompt and reflection.
4. Set `"sample": false` to remove the sample strip.

`content.json` is public, so don't put anything private in it, including in `details` or `extraNotes`.

## Test locally

```
npx wrangler pages dev
```

Without a key, the chatbot gives labelled preview replies. To test the real AI, copy `.dev.vars.example` to `.dev.vars` and add one key.

## Deploy to Cloudflare Pages

1. Put this folder in a GitHub repository.
2. In Cloudflare, go to Workers & Pages, create a Pages project and connect the repository.
3. Leave the build command empty and set the output directory to `public`.
4. Under Settings, Variables and Secrets, add `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` as a secret.
5. Redeploy so the key takes effect.

## Choosing the AI

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini key from AI Studio |
| `ANTHROPIC_API_KEY` | Claude key from the Claude Console; usage is paid |
| `AI_PROVIDER` | `gemini` or `claude`, only needed if both keys are set |
| `GEMINI_MODEL` | Overrides the default `gemini-flash-lite-latest` |
| `CLAUDE_MODEL` | Overrides the default `claude-haiku-5-5` |

## Before going public

- Set a spending cap with your AI provider. Anyone who visits can use the chatbot.
- Add a Cloudflare rate limiting rule for `/api/chat` if your site is on a custom domain. The built-in limit of 20 questions a minute per visitor is best effort only.
