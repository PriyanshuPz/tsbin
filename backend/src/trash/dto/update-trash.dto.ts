import { PartialType } from '@nestjs/mapped-types';
import { CreateTrashDto } from './create-trash.dto';

export class UpdateTrashDto extends PartialType(CreateTrashDto) {}
