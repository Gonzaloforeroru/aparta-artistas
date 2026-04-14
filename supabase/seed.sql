-- Seed: 5 artistas de prueba (status=Aprobado, active=true)
insert into public.artists (name, city, type, genre, phone, price, duration, photo, instagram, spotify, status, active)
values
  ('Juan Pérez', 'Bogotá', 'Cantante', 'Vallenato', '3101234567', 500000, '2 horas',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
   'https://instagram.com/juanperez', 'https://open.spotify.com/artist/juanperez',
   'Aprobado', true),

  ('María López', 'Medellín', 'DJ', 'Electrónica', '3009876543', 800000, '3 horas',
   'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&h=400&fit=crop',
   'https://instagram.com/marialopez', null,
   'Aprobado', true),

  ('Los Tropicales', 'Cali', 'Banda', 'Tropical', '3205551234', 1200000, '4 horas',
   'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop',
   'https://instagram.com/lostropicales', 'https://open.spotify.com/artist/lostropicales',
   'Aprobado', true),

  ('Sofía Martínez', 'Medellín', 'Cantante', 'Salsa', '3006665544', 600000, '2 horas',
   'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
   'https://instagram.com/sofiamartinez', 'https://open.spotify.com/artist/sofiamartinez',
   'Aprobado', true),

  ('Valentina Ríos', 'Bucaramanga', 'Cantante', 'Bachata', '3124445566', 450000, '2 horas',
   'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&h=400&fit=crop',
   'https://instagram.com/valentinarios', null,
   'Pendiente', true);
