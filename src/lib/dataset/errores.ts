export class ErrorDataset extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDataset";
  }
}
