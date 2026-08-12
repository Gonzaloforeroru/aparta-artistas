-- Sigla de la asociacion.
--
-- Los nombres reales no caben en una tarjeta: "Corporacion Universidad de la
-- Costa" se truncaba a mitad y no se entendia nada. La sigla es un dato de
-- presentacion, no una identidad distinta, asi que va como columna de la propia
-- asociacion y no como otra fila.
--
-- Es OPCIONAL a proposito: la regla al pintar es "usa la sigla si existe, si no
-- el nombre". Asi una "Fundacion X", que ya es corta, no tiene que inventarse
-- unas siglas, y la decision queda en manos del admin, que es quien sabe si la
-- institucion tiene una sigla reconocible.
--
-- El nombre completo sigue estando disponible: la tarjeta lo muestra al pasar
-- el raton y, en movil, al pulsar sobre la insignia.

alter table public.associations
  add column if not exists short_name text
  check (short_name is null or length(trim(short_name)) between 1 and 12);
