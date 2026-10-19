export class ProductoImportado {
  constructor({
    id,
    sku,
    nombre,
    categoria,
    proveedor,
    precioCostoUSD,
    margenGanancia,
    precioVentaCRC,
    stock = 0,
    ajusteAutomatico = true,
    protegidoPorContrato = false,
    motivoExclusion = null,
    ultimaActualizacion = new Date().toISOString()
  }) {
    if (!id || !sku || !nombre) {
      throw new Error(`[ProductoImportado] Identificadores inválidos para el producto: ${id || 'Sin ID'}`);
    }
    if (typeof precioCostoUSD !== 'number' || isNaN(precioCostoUSD) || precioCostoUSD <= 0) {
      throw new Error(`[ProductoImportado] Costo USD inválido para ${sku}: ${precioCostoUSD}`);
    }
    if (typeof margenGanancia !== 'number' || margenGanancia < 0) {
      throw new Error(`[ProductoImportado] Margen de ganancia inválido para ${sku}: ${margenGanancia}`);
    }

    this.id = id;
    this.sku = sku;
    this.nombre = nombre;
    this.categoria = categoria || 'General';
    this.proveedor = proveedor || 'No asignado';
    this.precioCostoUSD = precioCostoUSD;
    this.margenGanancia = margenGanancia;
    this.precioVentaCRC = precioVentaCRC;
    this.stock = stock;
    this.ajusteAutomatico = Boolean(ajusteAutomatico);
    this.protegidoPorContrato = Boolean(protegidoPorContrato);
    this.motivoExclusion = motivoExclusion;
    this.ultimaActualizacion = ultimaActualizacion;
  }

  // Regla 4: Verificación de elegibilidad integral para ajuste de precios
  esElegibleParaAjuste() {
    if (!this.ajusteAutomatico) {
      return { elegible: false, razon: 'Ajuste automático desactivado por configuración' };
    }
    if (this.protegidoPorContrato) {
      return { elegible: false, razon: 'Protegido por contrato corporativo cerrado' };
    }
    if (this.stock <= 0) {
      return { elegible: false, razon: 'Sin stock disponible; precio congelado' };
    }
    return { elegible: true, razon: 'Apto para recálculo automático' };
  }

  // Regla 5: Recálculo de precio en colones con margen de ganancia comercial y redondeo
  calcularNuevoPrecioCRC(nuevoTipoCambio) {
    if (typeof nuevoTipoCambio !== 'number' || nuevoTipoCambio <= 0) {
      throw new Error(`[ProductoImportado] Tipo de cambio no válido para el recálculo: ${nuevoTipoCambio}`);
    }

    const validacion = this.esElegibleParaAjuste();
    if (!validacion.elegible) {
      return {
        precioActualizado: false,
        precioFinalCRC: this.precioVentaCRC,
        razon: validacion.razon
      };
    }

    // Fórmula: Costo USD * (1 + Margen) * Tipo de Cambio Venta
    const precioBaseUSD = this.precioCostoUSD * (1 + this.margenGanancia);
    const nuevoPrecioCRC = Math.round(precioBaseUSD * nuevoTipoCambio);
    const diferenciaCRC = nuevoPrecioCRC - this.precioVentaCRC;

    return {
      precioActualizado: true,
      precioAnteriorCRC: this.precioVentaCRC,
      nuevoPrecioCRC,
      diferenciaCRC,
      razon: validacion.razon
    };
  }
}