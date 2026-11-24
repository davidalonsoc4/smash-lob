-- Pantalla a la que pertenece un vídeo tutorial. El botón de ayuda de cada pantalla ofrece el vídeo de esa pantalla.
-- screen: identificador de pantalla de la lista fija del código (por ejemplo 'match' o 'ranking'); null = sin pantalla.
alter table public.tutorial_videos
  add column if not exists screen text
  check (screen is null or char_length(screen) between 1 and 40);
