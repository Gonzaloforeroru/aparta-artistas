-- Catalogo amplio de generos musicales.
--
-- Sustituye a los 9 generos sembrados al principio, que se quedaban cortos: en
-- cuanto un artista tocaba champeta o joropo no tenia donde marcarse y acababa
-- inventando el tag, con el resultado que ya vimos ("reggue", "valenato").
--
-- No existe un registro oficial de generos musicales -- no hay un DANE de la
-- musica --, asi que esta lista es curada, no importada: peso fuerte en
-- folclor colombiano y latino, que es el mercado, mas lo internacional
-- habitual. Se puede ampliar desde el admin sin tocar codigo.
--
-- Todos entran como is_official = true: son catalogo, no propuestas.
-- El sort_order agrupa por familia para que el desplegable se lea ordenado
-- cuando alguien navega sin buscar.

insert into public.tags (kind, name, slug, is_official, sort_order)
select 'genre', v.name, public.slugify(v.name), true, v.ord
from (values
  -- Colombia: folclor y raices (100)
  ('Vallenato',100),('Cumbia',101),('Champeta',102),('Porro',103),('Currulao',104),
  ('Bambuco',105),('Joropo',106),('Mapale',107),('Bullerengue',108),('Gaita',109),
  ('Puya',110),('Merecumbe',111),('Chande',112),('Pasillo',113),('Guabina',114),
  ('Torbellino',115),('Carranga',116),('Musica Llanera',117),('Vallenato Romantico',118),
  ('Cumbia Villera',119),('Son Palenquero',120),('Fandango',121),

  -- Caribe y Antillas (200)
  ('Salsa',200),('Salsa Choke',201),('Merengue',202),('Bachata',203),('Son Cubano',204),
  ('Timba',205),('Guaracha',206),('Mambo',207),('Cha Cha Cha',208),('Bolero',209),
  ('Danzon',210),('Rumba',211),('Guaguanco',212),('Plena',213),('Bomba',214),
  ('Soca',215),('Calipso',216),('Zouk',217),('Kompa',218),('Dancehall',219),
  ('Reggae',220),('Ska',221),('Rocksteady',222),('Dub',223),

  -- Urbano (300)
  ('Reggaeton',300),('Trap Latino',301),('Hip Hop',302),('Rap',303),('Trap',304),
  ('R&B',305),('Neo Soul',306),('Drill',307),('Afrobeat',308),('Afrobeats',309),
  ('Dembow',310),('Perreo',311),('Boom Bap',312),('Freestyle',313),

  -- Tropical y baile (400)
  ('Tropical',400),('Musica de Planchar',401),('Orquesta',402),('Papayera',403),
  ('Verbena',404),('Sonidero',405),

  -- Mexico y regional (500)
  ('Mariachi',500),('Ranchera',501),('Norteno',502),('Banda Sinaloense',503),
  ('Corrido',504),('Corridos Tumbados',505),('Cumbia Nortena',506),('Huapango',507),
  ('Son Jarocho',508),('Bolero Ranchero',509),

  -- Sudamerica (600)
  ('Tango',600),('Milonga',601),('Chacarera',602),('Zamba',603),('Cueca',604),
  ('Huayno',605),('Saya',606),('Marinera',607),('Festejo',608),('Caporal',609),

  -- Brasil (700)
  ('Samba',700),('Bossa Nova',701),('Forro',702),('Axe',703),('Pagode',704),
  ('MPB',705),('Sertanejo',706),('Funk Carioca',707),('Choro',708),('Frevo',709),
  ('Maracatu',710),

  -- Pop y rock (800)
  ('Pop',800),('Pop Latino',801),('Rock',802),('Rock en Espanol',803),('Pop Rock',804),
  ('Indie',805),('Indie Rock',806),('Alternativo',807),('Punk',808),('Hardcore',809),
  ('Metal',810),('Heavy Metal',811),('Metalcore',812),('Grunge',813),('Britpop',814),
  ('New Wave',815),('Post Punk',816),('Shoegaze',817),('Emo',818),('Ska Punk',819),
  ('Rock Alternativo',820),('Hard Rock',821),('Progresivo',822),('Psicodelia',823),

  -- Electronica (900)
  ('Electronica',900),('House',901),('Deep House',902),('Tech House',903),
  ('Techno',904),('Minimal',905),('Trance',906),('Progressive House',907),
  ('Drum and Bass',908),('Dubstep',909),('EDM',910),('Guaracha Electronica',911),
  ('Afro House',912),('Melodic Techno',913),('Hardstyle',914),('Breakbeat',915),
  ('Downtempo',916),('Ambient',917),('Synthwave',918),('Future Bass',919),
  ('Moombahton',920),('Electro Latino',921),

  -- Jazz, blues y raices (1000)
  ('Jazz',1000),('Latin Jazz',1001),('Smooth Jazz',1002),('Swing',1003),('Bebop',1004),
  ('Blues',1005),('Soul',1006),('Funk',1007),('Disco',1008),('Gospel',1009),
  ('Motown',1010),('Big Band',1011),('Dixieland',1012),('Fusion',1013),

  -- Clasica y camara (1100)
  ('Musica Clasica',1100),('Opera',1101),('Barroco',1102),('Cuarteto de Cuerdas',1103),
  ('Piano Solo',1104),('Coral',1105),('Orquesta Sinfonica',1106),('Zarzuela',1107),
  ('Musica de Camara',1108),

  -- Otros usos frecuentes (1200)
  ('Acustico',1200),('Balada',1201),('Cantautor',1202),('Trova',1203),('Bolero Trio',1204),
  ('Serenata',1205),('Musica Cristiana',1206),('Worship',1207),('Villancicos',1208),
  ('Infantil',1209),('Instrumental',1210),('Lounge',1211),('Chill Out',1212),
  ('Covers',1213),('Tributo',1214),('Musica Andina',1215),('World Music',1216),
  ('Flamenco',1217),('Rumba Flamenca',1218),('Sevillanas',1219),('Pasodoble',1220),
  ('Country',1221),('Folk',1222),('Bluegrass',1223),('K-Pop',1224),('J-Pop',1225),
  ('Afrocolombiano',1226),('Experimental',1227),('Lo-Fi',1228),('Karaoke',1229)
) as v(name, ord)
on conflict (kind, slug) do nothing;


-- Los 9 originales quedan al principio del desplegable: son los mas usados y
-- ya tienen artistas asignados.
update public.tags set sort_order = 1
where kind = 'genre'
  and slug in ('vallenato','salsa','electronica','pop','rock','reggaeton',
               'tropical','cumbia','bachata');
