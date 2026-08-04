export default async function globalTeardown(): Promise<void> {
  // Nada a limpar: o banco de teste (tga_test) permanece de propósito para inspeção manual
  // (critério de saída da fase), e global-setup não mantém conexões abertas entre os testes
  // (usa execSync, que só retorna depois que os subprocessos já saíram).
}
