import { config } from '../../config';

type QdrantFilter = {
   must?: Array<{ key: string; match: { value: string } }>;
   should?: Array<{ key: string; match: { value: string } }>;
};

async function qdrantFetch<T>(path: string, init?: RequestInit): Promise<T> {
   const response = await fetch(`${config.qdrantUrl}${path}`, {
      headers: {
         'Content-Type': 'application/json',
      },
      ...init,
   });

   if (!response.ok) {
      throw new Error(
         `Qdrant request failed ${response.status}: ${await response.text()}`
      );
   }

   return (await response.json()) as T;
}

export async function ensureQdrantCollection(vectorSize: number) {
   try {
      await qdrantFetch(`/collections/${config.qdrantCollection}`);
      return;
   } catch {
      await qdrantFetch(`/collections/${config.qdrantCollection}`, {
         method: 'PUT',
         body: JSON.stringify({
            vectors: {
               size: vectorSize,
               distance: 'Cosine',
            },
         }),
      });
   }
}

export async function upsertQdrantPoints(
   points: Array<{
      id: string | number;
      vector: number[];
      payload: Record<string, unknown>;
   }>
) {
   await qdrantFetch(
      `/collections/${config.qdrantCollection}/points?wait=true`,
      {
         method: 'PUT',
         body: JSON.stringify({ points }),
      }
   );
}

export async function searchQdrant(
   vector: number[],
   limit: number,
   filter?: QdrantFilter
) {
   const data = await qdrantFetch<{
      result: Array<{
         id: string;
         score: number;
         payload: Record<string, unknown>;
      }>;
   }>(`/collections/${config.qdrantCollection}/points/search`, {
      method: 'POST',
      body: JSON.stringify({
         vector,
         limit,
         with_payload: true,
         filter,
      }),
   });

   return data.result;
}

export async function deleteQdrantByDocument(documentId: string) {
   await qdrantFetch(
      `/collections/${config.qdrantCollection}/points/delete?wait=true`,
      {
         method: 'POST',
         body: JSON.stringify({
            filter: {
               must: [{ key: 'documentId', match: { value: documentId } }],
            },
         }),
      }
   );
}

export async function qdrantHealth() {
   try {
      await qdrantFetch('/collections');
      return {
         ok: true,
         url: config.qdrantUrl,
         collection: config.qdrantCollection,
      };
   } catch (error) {
      return {
         ok: false,
         url: config.qdrantUrl,
         collection: config.qdrantCollection,
         error: error instanceof Error ? error.message : 'Unknown error',
      };
   }
}
