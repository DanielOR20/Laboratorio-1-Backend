export class MonitorDivisa {
    constructor(tipoCambioActual, tipoCambioHistorico, fecha = new Date().toISOString()) {
        if (typeof tipoCambioActual !== 'number' || isNaN(tipoCambioActual) || tipoCambioActual <= 0) {
            throw new Error(`[MonitorDivisa] Tipo de cambio actual inválido: ${tipoCambioActual}`);
        }
        if (typeof tipoCambioHistorico !== 'number' || isNaN(tipoCambioHistorico) || tipoCambioHistorico <= 0) {
            throw new Error(`[MonitorDivisa] Tipo de cambio histórico inválido: ${tipoCambioHistorico}`);
        }

        this.tipoCambioActual = tipoCambioActual;
        this.tipoCambioHistorico = tipoCambioHistorico;
        this.fecha = fecha;
    }

    // Regla 1: Cálculo exacto de variación porcentual
    calcularVariacionPorcentual() {
        const variacion = ((this.tipoCambioActual - this.tipoCambioHistorico) / this.tipoCambioHistorico) * 100;
        return Number(variacion.toFixed(4));
    }

    // Regla 2: Verificación de superación del umbral crítico definido
    superaUmbral(umbralMaximo) {
        if (typeof umbralMaximo !== 'number' || umbralMaximo <= 0) {
            throw new Error(`[MonitorDivisa] Umbral inválido: ${umbralMaximo}`);
        }
        const variacionAbsoluta = Math.abs(this.calcularVariacionPorcentual());
        return variacionAbsoluta >= umbralMaximo;
    }

    // Regla 3: Identificación de dirección y magnitud de tendencia
    obtenerDiagnostico(umbralAlerta, umbralCritico) {
        const variacion = this.calcularVariacionPorcentual();
        let tendencia = 'ESTABLE';

        if (variacion > 0) tendencia = 'ALCISTA';
        else if (variacion < 0) tendencia = 'BAJISTA';

        const esCritico = Math.abs(variacion) >= umbralCritico;
        const esAlerta = Math.abs(variacion) >= umbralAlerta;

        return {
            variacionPorcentual: variacion,
            tendencia,
            nivelRiesgo: esCritico ? 'CRITICO' : (esAlerta ? 'MODERADO' : 'BAJO'),
            requiereAjuste: esCritico
        };
    }
}