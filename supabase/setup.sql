-- Store the exact prompt used to generate each piece of AI media.
-- Safe to re-run.
alter table public.meme_images add column if not exists description_prompt text;
alter table public.meme_captions add column if not exists caption_prompt text;
