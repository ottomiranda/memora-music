-- Update existing songs with working audio URLs
UPDATE songs 
SET 
  audio_url_option1 = CASE 
    WHEN title = 'Alternativa Urbana' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    WHEN title = 'Memórias do Coração' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    WHEN title = 'Suave Melodia' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    WHEN title = 'Jardim Moderno' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    WHEN title = 'Funk da Alegria' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    WHEN title = 'Pop dos Sonhos' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    ELSE audio_url_option1
  END,
  audio_url_option2 = CASE 
    WHEN title = 'Alternativa Urbana' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    WHEN title = 'Memórias do Coração' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    WHEN title = 'Suave Melodia' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    WHEN title = 'Jardim Moderno' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    WHEN title = 'Funk da Alegria' THEN 'https://file-examples.com/storage/fe68c1f7d4c2d1b8e2c9b5c/2017/11/file_example_MP3_700KB.mp3'
    WHEN title = 'Pop dos Sonhos' THEN 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
    ELSE audio_url_option2
  END
WHERE title IN ('Alternativa Urbana', 'Memórias do Coração', 'Suave Melodia', 'Jardim Moderno', 'Funk da Alegria', 'Pop dos Sonhos');