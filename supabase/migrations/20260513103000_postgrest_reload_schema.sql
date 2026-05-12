-- PostgREST keeps a schema cache; after creating/replacing RPCs, reload so
-- clients can call e.g. mark_all_notifications_read without PGRST202 errors.
notify pgrst, 'reload schema';
