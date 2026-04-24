import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getControlPlaneClient } from '@p4-spc/db-control-plane';
import { getDataPlaneClient } from '@p4-spc/db-data-plane';

@ApiTags('data')
@Controller('tenants/:slug')
export class DataController {
  private async dataClientFor(slug: string): Promise<{
    orgId: string;
    client: ReturnType<typeof getDataPlaneClient>;
  }> {
    const control = getControlPlaneClient();
    const org = await control.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException(`Tenant '${slug}' not found`);
    return { orgId: org.id, client: getDataPlaneClient(org.dataPlaneDatabaseUrl) };
  }

  @Get('products')
  @ApiOperation({ summary: 'List products (parts) with their primary characteristic' })
  @ApiOkResponse()
  async listProducts(@Param('slug') slug: string): Promise<unknown[]> {
    const { client } = await this.dataClientFor(slug);
    const parts = await client.part.findMany({
      include: { characteristics: true },
      orderBy: { partNumber: 'asc' },
    });
    return parts.map((part) => {
      const primary = part.characteristics[0];
      return {
        id: part.id,
        partNumber: part.partNumber,
        description: part.description,
        variant: part.variant,
        metadata: part.metadata,
        characteristic: primary
          ? {
              id: primary.id,
              code: primary.code,
              description: primary.description,
              unit: primary.unit,
              nominal: primary.nominal,
              target: primary.target,
              lsl: primary.lowerSpecLimit,
              usl: primary.upperSpecLimit,
            }
          : null,
      };
    });
  }

  @Get('products/:partId/measurements')
  @ApiOperation({
    summary:
      'List measurements for all characteristics of a product, ordered by measurement time ASC',
  })
  @ApiOkResponse()
  async listMeasurements(
    @Param('slug') slug: string,
    @Param('partId') partId: string,
  ): Promise<unknown[]> {
    const { client } = await this.dataClientFor(slug);
    const part = await client.part.findUnique({
      where: { id: partId },
      include: { characteristics: true },
    });
    if (!part) throw new NotFoundException(`Part '${partId}' not found`);
    const charIds = part.characteristics.map((c) => c.id);
    if (charIds.length === 0) return [];
    const measurements = await client.measurement.findMany({
      where: { characteristicId: { in: charIds } },
      orderBy: { measuredAt: 'asc' },
    });
    return measurements.map((m) => ({
      id: m.id,
      characteristicId: m.characteristicId,
      value: m.value,
      status: m.status,
      measuredAt: m.measuredAt.toISOString(),
      operatorId: m.operatorId,
      machineId: m.machineId,
      gageId: m.gageId,
      aqdefKFields: m.aqdefKFields,
      extensions: m.extensions,
    }));
  }

  @Get('catalogs')
  @ApiOperation({ summary: 'List catalogs from tenant data-plane' })
  async listCatalogs(@Param('slug') slug: string): Promise<unknown[]> {
    const { client } = await this.dataClientFor(slug);
    const catalogs = await client.catalog.findMany({
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { key: 'asc' },
    });
    return catalogs;
  }

  @Post('catalogs')
  @ApiOperation({ summary: 'Create a new catalog (tenant-scoped)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['key', 'name', 'scope'],
      properties: {
        key: { type: 'string', example: 'tenant.lines' },
        name: { type: 'string', example: 'Výrobní linky' },
        scope: { type: 'string', enum: ['aqdef', 'spc', 'tenant'], example: 'tenant' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              label: { type: 'string' },
              order: { type: 'integer' },
              active: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async createCatalog(
    @Param('slug') slug: string,
    @Body() body: unknown,
  ): Promise<{ id: string; key: string }> {
    const { client } = await this.dataClientFor(slug);
    const input = body as {
      key?: string;
      name?: string;
      scope?: string;
      items?: Array<{ code: string; label: string; order?: number; active?: boolean }>;
    };
    if (!input.key || !input.name) throw new BadRequestException('key and name are required');
    if (input.scope && !['aqdef', 'spc', 'tenant'].includes(input.scope)) {
      throw new BadRequestException('scope must be aqdef|spc|tenant');
    }
    const existing = await client.catalog.findUnique({ where: { key: input.key } });
    if (existing) throw new BadRequestException(`Catalog '${input.key}' already exists`);
    const scope = input.scope ?? 'tenant';
    const catalog = await client.catalog.create({
      data: {
        key: input.key,
        name: input.name,
        scope,
        isSystem: false,
      },
    });
    if (input.items?.length) {
      await client.catalogItem.createMany({
        data: input.items.map((it, i) => ({
          catalogId: catalog.id,
          code: String(it.code),
          label: it.label,
          order: it.order ?? i,
          active: it.active ?? true,
        })),
      });
    }
    return { id: catalog.id, key: catalog.key };
  }

  @Put('catalogs/:key')
  @ApiOperation({
    summary: 'Replace catalog items (non-system catalogs only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              label: { type: 'string' },
              order: { type: 'integer' },
              active: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async updateCatalog(
    @Param('slug') slug: string,
    @Param('key') key: string,
    @Body() body: unknown,
  ): Promise<{ ok: true; itemCount: number }> {
    const { client } = await this.dataClientFor(slug);
    const cat = await client.catalog.findUnique({ where: { key } });
    if (!cat) throw new NotFoundException(`Catalog '${key}' not found`);
    if (cat.isSystem) {
      throw new BadRequestException(`Catalog '${key}' is a system catalog and cannot be edited`);
    }
    const input = body as {
      name?: string;
      items?: Array<{ code: string; label: string; order?: number; active?: boolean }>;
    };
    const items = input.items ?? [];
    await client.$transaction([
      client.catalog.update({
        where: { id: cat.id },
        data: input.name ? { name: input.name } : {},
      }),
      client.catalogItem.deleteMany({ where: { catalogId: cat.id } }),
      client.catalogItem.createMany({
        data: items.map((it, i) => ({
          catalogId: cat.id,
          code: String(it.code),
          label: it.label,
          order: it.order ?? i,
          active: it.active ?? true,
        })),
      }),
    ]);
    return { ok: true, itemCount: items.length };
  }

  @Delete('catalogs/:key')
  @ApiOperation({ summary: 'Delete a non-system catalog' })
  async deleteCatalog(
    @Param('slug') slug: string,
    @Param('key') key: string,
  ): Promise<{ ok: true }> {
    const { client } = await this.dataClientFor(slug);
    const cat = await client.catalog.findUnique({ where: { key } });
    if (!cat) throw new NotFoundException(`Catalog '${key}' not found`);
    if (cat.isSystem) {
      throw new BadRequestException(`Cannot delete system catalog '${key}'`);
    }
    await client.catalog.delete({ where: { id: cat.id } });
    return { ok: true };
  }
}
