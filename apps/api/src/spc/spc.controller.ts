import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { capability, checkNelson, iMRLimits, xbarRLimits, xbarSLimits } from '@p4-spc/spc-engine';
import {
  capabilityRequestSchema,
  controlLimitsRequestSchema,
  nelsonRequestSchema,
} from './dto.js';

@ApiTags('spc')
@Controller('spc')
export class SpcController {
  @Post('control-limits')
  @ApiOperation({
    summary: 'Compute control chart limits',
    description:
      'If `subgroups` are provided with size >= 2, X-bar/R (subgroup size 2..10) or X-bar/S ' +
      '(subgroup size > 10) limits are returned. If only `values` are given, I-MR is returned.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        subgroups: {
          type: 'array',
          example: [
            [10.1, 10.2, 10.0, 9.9, 10.1],
            [10.0, 10.1, 10.2, 9.95, 10.05],
          ],
          items: { type: 'array', items: { type: 'number' } },
        },
        values: {
          type: 'array',
          items: { type: 'number' },
          example: [10, 10.1, 9.9, 10.05, 9.95, 10.02],
        },
      },
    },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  controlLimits(@Body() body: unknown): unknown {
    const parsed = controlLimitsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const { subgroups, values } = parsed.data;
    if (subgroups) {
      const size = (subgroups[0] as readonly number[]).length;
      if (size <= 10) {
        return { type: 'xbar-r', result: xbarRLimits({ subgroups }) };
      }
      return { type: 'xbar-s', result: xbarSLimits({ subgroups }) };
    }
    return { type: 'i-mr', result: iMRLimits({ values: values as number[] }) };
  }

  @Post('nelson')
  @ApiOperation({
    summary: 'Check Nelson rules 1–4 on a sequence of values',
    description:
      'Input center and sigma from control chart limits; returns the list of violations ' +
      'keyed by rule number.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['values', 'center', 'sigma'],
      properties: {
        values: { type: 'array', items: { type: 'number' }, example: [10, 10.1, 13.5, 9.9, 6.5] },
        center: { type: 'number', example: 10 },
        sigma: { type: 'number', example: 1 },
        rules: {
          type: 'array',
          items: { type: 'integer', enum: [1, 2, 3, 4] },
          example: [1, 2, 3, 4],
        },
      },
    },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  nelson(@Body() body: unknown): unknown {
    const parsed = nelsonRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const { values, center, sigma, rules } = parsed.data;
    return checkNelson(values, { center, sigma }, rules ? { rules } : {});
  }

  @Post('capability')
  @ApiOperation({
    summary: 'Compute capability indices (Cp, Cpk, Pp, Ppk)',
    description:
      'Cp/Cpk use within-subgroup sigma (R-bar / d2, requires `subgroups`). Pp/Ppk use ' +
      'overall sample stdev (any `values` or flattened `subgroups`).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        subgroups: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
          example: [
            [10.02, 10.01, 9.99, 10.0, 10.03],
            [9.98, 10.02, 10.01, 10.0, 9.99],
          ],
        },
        values: { type: 'array', items: { type: 'number' } },
        lsl: { type: 'number', example: 9.9 },
        usl: { type: 'number', example: 10.1 },
        target: { type: 'number', example: 10.0 },
      },
    },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  capability(@Body() body: unknown): unknown {
    const parsed = capabilityRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return capability(parsed.data);
  }
}
