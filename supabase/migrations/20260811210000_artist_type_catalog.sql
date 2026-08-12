-- Catalogo de instrumentos (kind = 'profession').
--
-- Este archivo sembraba tambien un catalogo de 110 tipos de artista. Se retiro:
-- mezclaba tres ejes distintos en uno y la mayoria de sus entradas no eran
-- formatos sino generos o puestos dentro de una agrupacion. El eje "tipo de
-- artista" queda reducido a tres formatos en 20260811230000.
--
-- EL CRITERIO ES "QUE SE CONTRATA", NO "QUE SABE HACER LA PERSONA".
--
-- Un restaurante no contrata un bongosero: contrata una agrupacion, y como se
-- reparta por dentro es asunto suyo. Si pides un grupo folclorico no pides
-- aparte la percusion. Por eso el instrumento NO es un tipo de artista, es un
-- eje propio:
--
--   artist_type -> la unidad contratable (Solista, Agrupacion, DJ)
--   profession  -> el instrumento, que solo desambigua cuando la unidad es
--                  pequena: "Solista + Saxofonista" es el saxofonista que va a
--                  tocar musica ambiente. Dentro de una orquesta el instrumento
--                  no le dice nada al que contrata.
--
-- Se dejaron fuera a proposito danza, animacion, magia y circo: de momento la
-- plataforma es solo musica. Tambien Productor Musical, Beatmaker y VJ, que son
-- trabajo de estudio o de otro oficio, no alguien que va a tocar a un evento.
-- Si mas adelante hacen falta, el admin los crea desde /admin/tags: el catalogo
-- es cerrado para el artista, no para el admin.

insert into public.tags (kind, name, slug, is_official, sort_order)
select 'profession', v.name, public.slugify(v.name), true, v.ord
from (values
  -- Voz (100)
  ('Corista',100),

  -- Cuerdas (400)
  ('Guitarrista',400),('Bajista',401),('Violinista',402),('Violonchelista',403),
  ('Contrabajista',404),('Arpista',405),('Tiplista',406),('Bandolista',407),
  ('Requintista',408),('Cuatrista',409),('Ukelelista',410),('Banjista',411),

  -- Teclados y percusion (500)
  ('Pianista',500),('Tecladista',501),('Organista',502),('Acordeonista',503),
  ('Baterista',504),('Percusionista',505),('Timbalero',506),('Conguero',507),
  ('Bongosero',508),('Tamborilero',509),('Marimbero',510),('Cajonero',511),
  ('Tamborero',512),

  -- Vientos (600)
  ('Saxofonista',600),('Trompetista',601),('Trombonista',602),('Flautista',603),
  ('Clarinetista',604),('Gaitero',605),('Armonicista',606),('Tubista',607),
  ('Oboista',608),('Fagotista',609),('Corno',610)
) as v(name, ord)
on conflict (kind, slug) do nothing;
