export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'QUESTION_ALREADY_ANSWERED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message: string): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message);
  }

  static unauthenticated(message = 'Autenticação necessária.'): AppError {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }

  static invalidCredentials(message = 'Email ou senha inválidos.'): AppError {
    return new AppError(401, 'INVALID_CREDENTIALS', message);
  }

  static notFound(message = 'Recurso não encontrado.'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static emailAlreadyExists(message = 'Este email já está cadastrado.'): AppError {
    return new AppError(409, 'EMAIL_ALREADY_EXISTS', message);
  }

  static questionAlreadyAnswered(message = 'Esta pergunta já foi respondida.'): AppError {
    return new AppError(409, 'QUESTION_ALREADY_ANSWERED', message);
  }

  static tooManyRequests(message = 'Muitas requisições. Tente novamente mais tarde.'): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Erro interno do servidor.'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
