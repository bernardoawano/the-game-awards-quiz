import 'dotenv/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL não está definida. Configure-a em backend/.env antes de rodar os testes.');
}

const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '');
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `TEST_DATABASE_URL aponta para o banco "${databaseName}", que não termina em "_test". ` +
      'Isso é uma guarda de segurança contra apontar os testes pro banco de desenvolvimento.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
