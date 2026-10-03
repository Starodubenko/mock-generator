import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  isDocumentTypeSlug,
  normalizeDocumentTypeSlug,
} from '@entities/document-type/document-type-slug';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type AddDocumentTypeCommand = {
  documentType: string;
};

@Injectable()
export class AddDocumentTypeHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: AddDocumentTypeCommand,
  ): Promise<{ documentType: string }> {
    const documentType = normalizeDocumentTypeSlug(command.documentType);
    if (!isDocumentTypeSlug(documentType)) {
      throw new DomainHttpException(
        422,
        'validation_error',
        'Идентификатор типа: латиница, цифры и дефис, с буквы',
        '',
      );
    }
    if (await this.store.hasDocumentType(documentType)) {
      throw new DomainHttpException(
        422,
        'validation_error',
        'Такой тип уже есть',
        '',
      );
    }
    await this.store.addDocumentType(documentType);
    return { documentType };
  }
}
