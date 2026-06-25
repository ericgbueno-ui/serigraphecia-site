import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

interface ImportFornecedor {
  nome: string;
  produto: string;
  whatsapp?: string;
  email?: string;
}

// POST: Importar fornecedores em lote
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json() as ImportFornecedor[];

    const created = await Promise.all(
      data.map(f =>
        prisma.fornecedor.create({
          data: {
            nome: f.nome,
            produto: f.produto,
            whatsapp: f.whatsapp || null,
            email: f.email || null,
            ativo: true,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        count: created.length,
        data: created,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API/fornecedores] Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET: Listar fornecedores
export const GET: APIRoute = async () => {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: { nome: 'asc' },
    });

    return new Response(JSON.stringify(fornecedores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API/fornecedores] List error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch fornecedores' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
