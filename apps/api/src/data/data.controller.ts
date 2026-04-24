import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
