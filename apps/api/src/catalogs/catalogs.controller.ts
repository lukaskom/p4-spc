import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { systemCatalogSeeds } from '@p4-spc/aqdef-core';

@ApiTags('catalogs')
@Controller('catalogs')
export class CatalogsController {
  @Get()
  @ApiOperation({ summary: 'List all system catalogs (AQDEF seeds)' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'aqdef.k0002.status' },
          name: { type: 'string' },
          scope: { type: 'string', enum: ['aqdef', 'spc', 'tenant'] },
          isSystem: { type: 'boolean' },
          itemCount: { type: 'integer' },
        },
      },
    },
  })
  list(): ReadonlyArray<{
    key: string;
    name: string;
    scope: string;
    isSystem: boolean;
    itemCount: number;
  }> {
    return systemCatalogSeeds.map((c) => ({
      key: c.key,
      name: c.name,
      scope: c.scope,
      isSystem: c.isSystem,
      itemCount: c.items.length,
    }));
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a catalog with all items by key' })
  @ApiParam({ name: 'key', example: 'aqdef.k0002.status' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('key') key: string): unknown {
    const seed = systemCatalogSeeds.find((c) => c.key === key);
    if (!seed) {
      throw new NotFoundException(`Catalog '${key}' not found`);
    }
    return seed;
  }
}
