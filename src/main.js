import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MonitorDivisa } from './models/MonitorDivisa.js';
import { ProductoImportado } from './models/ProductoImportado.js';

// Carga de datos reales desde db.json para pruebas independientes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db.json');
const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log("================================================================================");
console.log("   PRUEBA DE DOMINIO POO - SISTEMA DE GESTIÓN CAMBIARIA Y PRECIOS");
console.log("================================================================================\n");

// 1. Simulación de lectura del tipo de cambio
// Obtenemos el último registro del histórico guardado
const ultimoHistorico = dbData.historicoTipoCambio[dbData.historicoTipoCambio.length - 1];

// Supongamos que la API externa del BCCR reporta un incremento a 526.25 (salto cambiario)
const tcSimuladoActual = 526.25;
const umbralAlerta = dbData.configuracion.umbralVariacionAlerta;
const umbralCritico = dbData.configuracion.umbralVariacionAjusteCritico;

console.log("--- 1. EVALUACIÓN CAMBIARIA (MonitorDivisa) ---");
const monitor = new MonitorDivisa(tcSimuladoActual, ultimoHistorico.tipoCambioVenta);
const diagnostico = monitor.obtenerDiagnostico(umbralAlerta, umbralCritico);

console.log(`Tipo de Cambio Anterior (db.json):  ₡${monitor.tipoCambioHistorico}`);
console.log(`Tipo de Cambio Actual (Simulado):   ₡${monitor.tipoCambioActual}`);
console.log(`Variación Porcentual:               ${diagnostico.variacionPorcentual}%`);
console.log(`Tendencia del Mercado:              ${diagnostico.tendencia}`);
console.log(`Nivel de Riesgo Operativo:          ${diagnostico.nivelRiesgo}`);
console.log(`¿Dispara Ajuste Crítico (>=${umbralCritico}%)?:  ${diagnostico.requiereAjuste ? "SÍ -> INICIAR RECALCULO" : "NO"}\n`);

// 2. Procesamiento de catálogo según reglas de negocio
console.log("--- 2. PROCESAMIENTO DE CATÁLOGO (ProductoImportado) ---");

if (diagnostico.requiereAjuste) {
  let procesados = 0;
  let ajustados = 0;
  let omitidos = 0;

  dbData.productos.forEach((item) => {
    procesados++;
    const producto = new ProductoImportado(item);
    const resultado = producto.calcularNuevoPrecioCRC(monitor.tipoCambioActual);

    if (resultado.precioActualizado) {
      ajustados++;
      console.log(`[AJUSTADO] [${producto.sku}] ${producto.nombre}`);
      console.log(`   Precio Anterior: ₡${resultado.precioAnteriorCRC.toLocaleString('es-CR')} | Nuevo: ₡${resultado.nuevoPrecioCRC.toLocaleString('es-CR')} (Dif: +₡${resultado.diferenciaCRC.toLocaleString('es-CR')})`);
      console.log(`   Motivo: ${resultado.razon}\n`);
    } else {
      omitidos++;
      console.log(`[OMITIDO]  [${producto.sku}] ${producto.nombre}`);
      console.log(`   Precio Mantenido: ₡${resultado.precioFinalCRC.toLocaleString('es-CR')}`);
      console.log(`   Motivo: ${resultado.razon}\n`);
    }
  });

  console.log("--- RESUMEN DE EJECUCIÓN ---");
  console.log(`Total productos evaluados: ${procesados}`);
  console.log(`Total productos actualizados: ${ajustados}`);
  console.log(`Total productos congelados / excluidos: ${omitidos}`);
} else {
  console.log("La variación cambiaria se encuentra en rangos tolerables. Precios sin modificaciones.");
}

console.log("\n================================================================================");