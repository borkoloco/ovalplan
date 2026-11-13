-- Un ejercicio puede cargarse en castellano o en inglés (el otro idioma se completa al revisarlo).
alter table public.exercises drop constraint exercises_name_check;
alter table public.exercises drop constraint exercises_summary_check;
alter table public.exercises add constraint exercises_name_check check (name ?| array['es', 'en']);
alter table public.exercises add constraint exercises_summary_check check (summary ?| array['es', 'en']);
