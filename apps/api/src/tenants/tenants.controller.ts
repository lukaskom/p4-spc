import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getControlPlaneClient } from '@p4-spc/db-control-plane';
import { tenantConfigSchema, type TenantConfig } from '@p4-spc/config-sdk';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  @Get(':slug/config')
  @ApiOperation({ summary: 'Get active tenant configuration document' })
  @ApiOkResponse()
  async getConfig(@Param('slug') slug: string): Promise<{
    organizationId: string;
    version: number;
    config: TenantConfig;
  }> {
    const prisma = getControlPlaneClient();
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException(`Tenant '${slug}' not found`);

    const active = await prisma.tenantConfig.findFirst({
      where: { organizationId: org.id, active: true },
      orderBy: { version: 'desc' },
    });
    if (!active) throw new NotFoundException(`Tenant '${slug}' has no active config`);

    return {
      organizationId: org.id,
      version: active.version,
      config: active.document as unknown as TenantConfig,
    };
  }

  @Put(':slug/config')
  @ApiOperation({
    summary: 'Replace tenant configuration (creates a new version, marks previous inactive)',
  })
  @ApiOkResponse()
  async putConfig(
    @Param('slug') slug: string,
    @Body() body: unknown,
  ): Promise<{ version: number }> {
    const parsed = tenantConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const prisma = getControlPlaneClient();
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException(`Tenant '${slug}' not found`);

    const current = await prisma.tenantConfig.findFirst({
      where: { organizationId: org.id, active: true },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (current?.version ?? 0) + 1;

    const created = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.tenantConfig.update({
          where: { id: current.id },
          data: { active: false },
        });
      }
      return tx.tenantConfig.create({
        data: {
          organizationId: org.id,
          version: nextVersion,
          active: true,
          document: parsed.data as unknown as object,
        },
      });
    });

    return { version: created.version };
  }
}
