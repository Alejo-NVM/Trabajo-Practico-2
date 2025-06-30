function generarSugerencias(nombreBase) {
  const sufijos = [Math.floor(Math.random() * 1000), "123", "01", "dev", "pro"];
  const sugerencias = [];

  while (sugerencias.length < 3) {
    const sugerencia = `${nombreBase}${
      sufijos[Math.floor(Math.random() * sufijos.length)]
    }`;
    if (!sugerencias.includes(sugerencia)) {
      sugerencias.push(sugerencia);
    }
  }

  return sugerencias;
}

module.exports = { generarSugerencias };
