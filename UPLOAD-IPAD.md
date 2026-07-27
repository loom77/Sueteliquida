# Caricamento da iPad con Working Copy

1. Estrai `primy-v11-production-ux-final.zip` nell'app File.
2. In Working Copy clona o apri il repository Primy.
3. Copia nella radice del repository il contenuto della cartella estratta.
4. Accetta la sostituzione dei file esistenti.
5. Apri **Changes** e verifica che siano presenti `src`, `api`, `tests` e i file della radice.
6. Esegui il commit con un messaggio come:

```text
Upgrade Primy v11 Evidence Engine
```

7. Esegui **Push**.
8. Controlla il nuovo deployment su Vercel.

Non caricare lo ZIP come singolo file e non creare una cartella esterna sopra `src` e `api`.
