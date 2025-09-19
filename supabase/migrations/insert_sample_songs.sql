-- Insert sample songs for testing the Artists section
-- This migration adds sample songs with covers and audio URLs for testing

INSERT INTO public.songs (
  id,
  guest_id,
  title,
  lyrics,
  prompt,
  genre,
  mood,
  image_url,
  audio_url_option1,
  audio_url_option2,
  generation_status,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'demo_guest',
  'Memórias do Coração',
  'Nas páginas do tempo, encontro você\nCada foto conta nossa história\nAmor que não se esquece, sempre vai viver\nNas memórias do coração, nossa glória',
  'Uma canção nostálgica sobre memórias de amor',
  'Neo Soul',
  'nostalgic',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20vinyl%20record%20player%20with%20warm%20golden%20sunset%20background%20nostalgic%20atmosphere&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3',
  'completed',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'demo_guest',
  'Alternativa Urbana',
  'Nas ruas da cidade, eu encontro meu som\nGuitarras distorcidas, batida que é bom\nRebelde por natureza, livre para sonhar\nNa música alternativa, vou me expressar',
  'Rock alternativo urbano com energia jovem',
  'Rock Alternativo',
  'energetic',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=urban%20graffiti%20wall%20with%20electric%20guitar%20and%20city%20lights%20alternative%20rock%20vibe&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_1MG.mp3',
  'completed',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'demo_guest',
  'Suave Melodia',
  'Notas suaves dançam no ar\nMelodia que toca a alma\nSoft rock para relaxar\nMúsica que traz a calma',
  'Soft rock relaxante e melódico',
  'Soft Rock',
  'calm',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=acoustic%20guitar%20on%20soft%20pink%20clouds%20dreamy%20peaceful%20atmosphere&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_2MG.mp3',
  'completed',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
(
  gen_random_uuid(),
  'demo_guest',
  'Jardim Moderno',
  'Entre flores digitais, eu caminho\nChoro moderno ecoa no jardim\nNatureza e tecnologia, novo caminho\nMúsica que nunca tem fim',
  'Choro moderno com elementos contemporâneos',
  'Choro Moderno',
  'peaceful',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20flower%20garden%20with%20modern%20digital%20elements%20peaceful%20nature&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_5MG.mp3',
  'completed',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
),
(
  gen_random_uuid(),
  'demo_guest',
  'Funk da Alegria',
  'Batida que contagia, todo mundo dança\nFunk melody que não cansa\nAlegria pura, energia que avança\nNa pista, só esperança',
  'Funk melody alegre e dançante',
  'Funk Melody',
  'happy',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=vibrant%20dance%20floor%20with%20colorful%20lights%20and%20speakers%20funk%20party%20atmosphere&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3',
  'completed',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  gen_random_uuid(),
  'demo_guest',
  'Pop dos Sonhos',
  'Sonhos coloridos voam pelo céu\nPop que toca o coração\nMelodia doce como mel\nCada nota, uma emoção',
  'Pop cativante com melodias doces',
  'Axé Pop',
  'uplifting',
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dreamy%20sky%20with%20floating%20musical%20notes%20and%20colorful%20balloons%20uplifting%20pop%20vibe&image_size=square_hd',
  'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
  'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_1MG.mp3',
  'completed',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.songs TO anon;
GRANT ALL PRIVILEGES ON public.songs TO authenticated;