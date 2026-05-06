UPDATE ilanlar
SET slug = TRIM(
  BOTH '-' FROM REGEXP_REPLACE(
    LOWER(
      TRANSLATE(
        COALESCE(NULLIF(baslik, ''), id::text),
        'çÇğĞıİöÖşŞüÜâîû',
        'ccggiioossuuaiu'
      )
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  )
)
WHERE slug IS NULL
   OR slug ~ '[çÇğĞıİöÖşŞüÜâîûÂÎÛ]'
   OR slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
