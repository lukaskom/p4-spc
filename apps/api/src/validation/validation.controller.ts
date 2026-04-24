import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  newCharacteristicSchema,
  newMeasurementSchema,
  newPartSchema,
} from '@p4-spc/aqdef-core';

function validateWith<T extends { safeParse: (v: unknown) => { success: boolean; error?: unknown; data?: unknown } }>(
  schema: T,
  value: unknown,
): { valid: true; parsed: unknown } | { valid: false; errors: unknown } {
  const result = schema.safeParse(value);
  if (result.success) return { valid: true, parsed: result.data };
  return { valid: false, errors: (result.error as { flatten: () => unknown }).flatten() };
}

@ApiTags('validation')
@Controller('validate')
export class ValidationController {
  @Post('part')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate a NewPart payload against aqdef-core Zod schema' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        partNumber: 'P-001',
        description: 'Demo piston',
        drawingNumber: 'DWG-0001',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Validation result (valid=true or errors)' })
  validatePart(@Body() body: unknown): unknown {
    return validateWith(newPartSchema, body);
  }

  @Post('characteristic')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate a NewCharacteristic payload' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        partId: '11111111-1111-4111-8111-111111111111',
        code: 'DIM-1',
        type: 1,
        nominal: 10,
        lowerSpecLimit: 9.9,
        upperSpecLimit: 10.1,
        toleranceType: 0,
        unit: 'mm',
        decimals: 3,
      },
    },
  })
  validateCharacteristic(@Body() body: unknown): unknown {
    return validateWith(newCharacteristicSchema, body);
  }

  @Post('measurement')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate a NewMeasurement payload' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        characteristicId: '22222222-2222-4222-8222-222222222222',
        value: 10.023,
        measuredAt: '2026-04-24T12:30:00Z',
        operatorId: 'OP-42',
        machineId: 'MC-7',
      },
    },
  })
  validateMeasurement(@Body() body: unknown): unknown {
    return validateWith(newMeasurementSchema, body);
  }
}
