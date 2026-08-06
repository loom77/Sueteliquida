# Protezione permanente delle release

Prima di qualsiasi ZIP o push eseguire:

```bash
npm install
npm run release:check
```

`release:check` blocca la pubblicazione se:
- manca un file critico;
- `src` contiene meno di 100 file;
- i test sono meno di 40;
- un test fallisce;
- la build fallisce.

Non sostituire mai la directory completa con uno ZIP classificato come hotfix o patch. Le patch devono essere sovrapposte a una release completa e verificate con un confronto del manifest.
