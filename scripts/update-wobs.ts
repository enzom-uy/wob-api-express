import 'dotenv/config';
import { db } from '../src/db/db.js';
import { wob, tags, wobTags } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';

const currentYear = new Date().getFullYear();
const API_BASE_URL = `https://wob.coppermind.net/api/search_entry/?ordering=-date&date_from=2001-01-01&date_to=${currentYear + 1}-01-01&page=`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Iniciando feed de WoBs desde la API de Coppermind...');

  let page = 1;
  let cooldown = 2000;
  let hasNextPage = true;

  while (hasNextPage) {
    const url = `${API_BASE_URL}${page}`;
    console.log(`\n[Página ${page}] Haciendo fetch a: ${url}`);

    try {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited
        cooldown *= 2;
        console.warn(`[!] RATE LIMIT (429) detectado. Aumentando cooldown a ${cooldown}ms.`);
        console.log(`[!] Esperando ${cooldown}ms antes de reintentar la página ${page}...`);
        await sleep(cooldown);
        continue; // Reintentar la misma página
      }

      if (!response.ok) {
        console.error(`[!] Error inesperado en la API: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        console.log(`[INFO] No hay más resultados en la página ${page}. Finalizando feed.`);
        break;
      }

      console.log(
        `[INFO] Página ${page} obtenida con éxito (${results.length} WoBs encontradas). Procesando...`,
      );

      let newWobsInPage = 0;

      for (const entry of results) {
        const coppermindId = entry.id;
        const eventId = entry.event;
        const sourceUrl = `https://wob.coppermind.net/events/${eventId}/#e${coppermindId}`;
        const entryTags = entry.tags || [];

        console.log(`  -> Chequeando WoB #${coppermindId} (Evento ${eventId})...`);

        let existingWob = await db
          .select()
          .from(wob)
          .where(eq(wob.coppermindId, coppermindId))
          .limit(1);

        if (existingWob.length > 0) {
          console.log(`    [!] La WoB #${coppermindId} ya existe. Omitiendo...`);
          continue;
        }

        newWobsInPage++;
        console.log(`    [+] Insertando nueva WoB #${coppermindId}...`);
        const inserted = await db
          .insert(wob)
          .values({
            coppermindId,
            eventId,
            data: entry.lines,
            note: entry.note || null,
            sourceUrl,
            date: entry.date ? new Date(entry.date) : null,
          })
          .returning();
        let currentWobId = inserted[0].id;

        // 2. Procesar e insertar los Tags
        if (entryTags.length > 0) {
          for (const tagName of entryTags) {
            let tagRecord = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
            let currentTagId: string;

            if (tagRecord.length === 0) {
              const insertedTag = await db.insert(tags).values({ name: tagName }).returning();
              currentTagId = insertedTag[0].id;
            } else {
              currentTagId = tagRecord[0].id;
            }

            // 3. Crear la relación WoB <-> Tag si no existe
            const existingRelation = await db
              .select()
              .from(wobTags)
              .where(and(eq(wobTags.wobId, currentWobId), eq(wobTags.tagId, currentTagId)))
              .limit(1);

            if (existingRelation.length === 0) {
              await db.insert(wobTags).values({
                wobId: currentWobId,
                tagId: currentTagId,
              });
            }
          }
          console.log(`    [+] Se asociaron ${entryTags.length} tags a la WoB #${coppermindId}.`);
        }
      }

      if (newWobsInPage === 0) {
        console.log(`[INFO] No se encontraron WoBs nuevas en la página ${page}. El bot está al día. Finalizando update.`);
        break;
      }

      if (!data.next) {
        console.log(`[INFO] No hay propiedad "next" en la respuesta. Finalizando feed.`);
        hasNextPage = false;
      } else {
        page++;
        console.log(`[INFO] Esperando cooldown de ${cooldown}ms antes de la siguiente página...`);
        await sleep(cooldown);
      }
    } catch (error) {
      console.error(`[!] Error al procesar la página ${page}:`, error);
      console.log(`[INFO] Esperando 5 segundos antes de reintentar debido al error...`);
      await sleep(5000);
    }
  }

  console.log('¡Feed de WoBs finalizado!');
}

main().catch(console.error);
