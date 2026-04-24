import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'p4-spc-api' },
        version: { type: 'string', example: '0.0.1' },
        uptimeSec: { type: 'number', example: 42 },
      },
    },
  })
  check(): { status: 'ok'; service: string; version: string; uptimeSec: number } {
    return {
      status: 'ok',
      service: 'p4-spc-api',
      version: '0.0.1',
      uptimeSec: Math.round(process.uptime()),
    };
  }
}
