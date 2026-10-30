function dosDigitos(valor: number): string {
  return valor.toString().padStart(2, "0");
}

export function sumarMinutos(hora: string, minutos: number): string {
  const [horas, minutosBase] = hora.split(":").map(Number);
  const total =
    (((horas * 60 + minutosBase + Math.round(minutos)) % (24 * 60)) + 24 * 60) %
    (24 * 60);

  return `${dosDigitos(Math.floor(total / 60))}:${dosDigitos(total % 60)}`;
}
